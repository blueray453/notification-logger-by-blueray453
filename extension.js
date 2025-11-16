import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { setLogging, setLogFn, journal } from './utils.js'
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

const originalAddNotification = MessageTray.Source.prototype.addNotification;

export default class NotificationThemeExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    this._sourceAddedId = null;
  }

  enable() {
    // Main.notify('My Extension', 'This is a notification from my GNOME extension!');
    // global.notify_error("msg", "details");
    // Nothing to do; stylesheet.css handles everything

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

    MessageTray.Source.prototype.addNotification = function (notification) {      // Log details
      journal(`title: ${notification.title}`);
      journal(`body: ${notification.body}`);

      const urgencyMap = {
        0: "low",
        1: "normal",
        2: "normal",
        3: "critical"
      };

      const urgencyText = urgencyMap[notification._urgency] || "unknown";
      journal(`urgency: ${urgencyText}`);

      // Call the original addNotification
      return originalAddNotification.call(this, notification);
    };
  }

  disable() {
    MessageTray.Source.prototype.addNotification = originalAddNotification;
  }
}
