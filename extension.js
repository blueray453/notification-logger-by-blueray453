import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import { setLogging, setLogFn, journal } from './utils.js';
import { PrototypeInjector } from './PrototypeInjector.js';

// const _originalAddNotification = MessageTray.Source.prototype.addNotification;
// const _originalOnRequestBanner = MessageTray.MessageTray.prototype._onNotificationRequestBanner;

export default class NotificationThemeExtension extends Extension {
  enable() {
    // Main.notify('My Extension', 'This is a notification from my GNOME extension!');
    // global.notify_error("msg", "details");
    // Nothing to do; stylesheet.css handles everything
    this.injector = new PrototypeInjector();

    setLogFn((msg, error = false) => {
      let level;
      if (error) {
        level = GLib.LogLevelFlags.LEVEL_CRITICAL;
      } else {
        level = GLib.LogLevelFlags.LEVEL_MESSAGE;
      }

      GLib.log_structured(
        'notification-logger-by-blueray453',
        level,
        {
          MESSAGE: `${msg}`,
          SYSLOG_IDENTIFIER: 'notification-logger-by-blueray453',
          CODE_FILE: GLib.filename_from_uri(import.meta.url)[0]
        }
      );
    });

    setLogging(true);

    // journalctl -f -o cat SYSLOG_IDENTIFIER=notification-logger-by-blueray453
    journal(`Enabled`);
    // journal(`originalAddNotification ${this.originalAddNotification}`);
    this._patchNotificationAddNotification();
    this._patchNotificationRequestBanner();
  }

  _patchNotificationAddNotification() {
    this.injector.before(
      MessageTray.Source.prototype,
      'addNotification',
      function (notification) {
        // Log details
        journal(`title: ${notification.title}`);
        journal(`body: ${notification.body}`);

        const urgencyMap = {
          0: "low",
          1: "normal",
          2: "high",
          3: "critical"
        };
        const urgencyText = urgencyMap[notification._urgency] || "unknown";
        journal(`urgency: ${urgencyText}`);
      }
    );
    // MessageTray.Source.prototype.addNotification = function (notification) {
    //   // Log details
    //   journal(`title: ${notification.title}`);
    //   journal(`body: ${notification.body}`);

    //   const urgencyMap = {
    //     0: "low",
    //     1: "normal",
    //     2: "high",
    //     3: "critical"
    //   };

    //   const urgencyText = urgencyMap[notification._urgency] || "unknown";
    //   journal(`urgency: ${urgencyText}`);

    //   // Call the original addNotification
    //   return _originalAddNotification.call(this, notification);
    // };
  }

  _patchNotificationRequestBanner() {
    this.injector.override(
      MessageTray.MessageTray.prototype,
      '_onNotificationRequestBanner',
      function () {
        // Log details
        return;
      }
    );
    // MessageTray.MessageTray.prototype._onNotificationRequestBanner = function () {
    //   // Log details
    //   return;
    // };
  }

  disable() {
    this.injector.removeAllInjections();
    // MessageTray.Source.prototype.addNotification = _originalAddNotification;

    // MessageTray.MessageTray.prototype._onNotificationRequestBanner = _originalOnRequestBanner;
  }
}
