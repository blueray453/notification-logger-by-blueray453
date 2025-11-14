import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { setLogging, setLogFn, journal } from './utils.js'

const MessageTray = Main.messageTray;

export default class NotificationThemeExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    this._sourceAddedId = null;

    // Store ALL notification-added IDs per source
    this._notificationSignalIds = new Map();
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
        'fix-css-by-blueray453',
        level,
        {
          MESSAGE: `${msg}`,
          SYSLOG_IDENTIFIER: 'fix-css-by-blueray453',
          CODE_FILE: GLib.filename_from_uri(import.meta.url)[0]
        }
      );
    });

    setLogging(true);

    // journalctl -f -o cat SYSLOG_IDENTIFIER=fix-css-by-blueray453
    journal(`Enabled`);

    this._sourceAddedId = MessageTray.connect("source-added", this._on_source_added.bind(this));
  }

  _on_source_added(tray, source) {
    const id = source.connect(
      "notification-added",
      this._on_notification_added.bind(this)
    );

    // Save it so we can disconnect later
    this._notificationSignalIds.set(source, id);
  }

  _on_notification_added(source, notification) {
    journal(`notification: ${notification}`);

    // for (let key in notification) {
    //   try {
    //     journal(`${key}: ${notification[key]}`);
    //   } catch (e) {

    //   }
    // }

    journal(`title: ${notification.title}`);
    journal(`body: ${notification.body}`);
  }

  disable() {
    if (this._sourceAddedId) {
      MessageTray.disconnect(this._sourceAddedId);
      this._sourceAddedId = null;
    }
    // 2. Disconnect all notification-added signals
    for (let [source, id] of this._notificationSignalIds) {
      try {
        source.disconnect(id);
      } catch (err) {
        // ignore if source is gone
      }
    }

    this._notificationSignalIds.clear();
  }
}
