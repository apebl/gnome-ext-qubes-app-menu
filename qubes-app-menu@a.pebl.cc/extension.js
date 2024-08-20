/* exported init */

const { GObject, Gio, St, Clutter } = imports.gi

const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu

const ExtensionUtils = imports.misc.extensionUtils
const _ = ExtensionUtils.gettext

const Me = ExtensionUtils.getCurrentExtension()

Gio._promisify(Gio.Subprocess.prototype, 'wait_async')

async function spawn(argv, cancellable = null) {
  const flags = Gio.SubprocessFlags.NONE
  const proc = new Gio.Subprocess({ argv: argv, flags: flags })
  proc.init(cancellable)

  const cancel_id = cancellable ? cancellable.connect(() => proc.force_exit()) : 0

  try {
    await proc.wait_async(cancellable)
  } finally {
    if (cancel_id > 0) {
      cancellable.disconnect(cancel_id)
    }
  }
}

const AppMenuButton = GObject.registerClass(
  {},
  class AppMenuButton extends PanelMenu.Button {
    #icon
    #cancellable

    constructor() {
      super(0.0, null, true)
      this.name = 'panelApplications'

      this.#icon = new St.Icon({
        icon_name: 'qubes-logo',
        style_class: 'system-status-icon',
      })
      this.add_actor(this.#icon)
    }

    vfunc_event(event) {
      if (
        event.type() === Clutter.EventType.TOUCH_END ||
        event.type() === Clutter.EventType.BUTTON_RELEASE
      ) {
        this.toggle()
        return Clutter.EVENT_STOP
      }
      return Clutter.EVENT_PROPAGATE
    }

    toggle() {
      const cancellable = this.#cancellable
      if (cancellable) {
        cancellable.cancel()
        return
      }

      this.#cancellable = new Gio.Cancellable()
      spawn(['qubes-app-menu'])
        .catch((err) => {
          logError(err)
        })
        .finally(() => {
          this.#cancellable = null
        })
    }
  },
)

class Extension {
  #button

  constructor() {
    ExtensionUtils.initTranslations()
  }

  enable() {
    Main.panel.statusArea.activities.container.hide()
    this.#button = new AppMenuButton()
    Main.panel.addToStatusArea(Me.metadata.uuid, this.#button, 0, 'left')
  }

  disable() {
    Main.panel.statusArea.activities.container.show()
    this.#button.destroy()
    this.#button = null
  }
}

function init() {
  return new Extension()
}
