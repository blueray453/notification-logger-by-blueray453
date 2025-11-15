import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { setLogging, setLogFn, journal } from './utils.js'

const MessageTray = Main.messageTray;

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

    this._sourceAddedId = MessageTray.connect("source-added", this._on_source_added.bind(this));
  }

  _on_source_added(tray, source) {

    // journal(`tray: ${tray}`);

    const notificationSignalId = source.connect(
      "notification-added", (source, notification) => {
      // journal(`notification: ${notification}`);

      // for (let key in notification) {
      //   try {
      //     journal(`${key}: ${notification[key]}`);
      //   } catch (e) {

      //   }
      // }

      try {
        journal(`title: ${notification.title}`);
        journal(`body: ${notification.body}`);

        const urgencyMap = {
          0: "low",
          1: "normal",
          3: "critical"
        };

        const urgencyText = urgencyMap[notification._urgency] || "unknown";

        journal(`urgency: ${urgencyText}`);
      } finally {
        source.disconnect(notificationSignalId);
      }
    });
  }

  disable() {
    if (this._sourceAddedId) {
      MessageTray.disconnect(this._sourceAddedId);
      this._sourceAddedId = null;
    }
  }
}
