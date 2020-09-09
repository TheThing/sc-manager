const m = require('mithril')
const socket = require('../socket')
const Module = require('../module')

const Updater = Module({
  init: function(vnode) {
    this.activeApp = vnode.attrs.id || null
    this.appRepository = null
    this.manageRepository = null
    this.db = null
    this.app = {}
    this.status = {}
    this.logUpdated = false
    this._socketOn(() => this.socketOpen())
    this._active = null

    if (this.activeApp && this.activeApp !== 'app'&& this.activeApp !== 'manage') {
      return m.route('/updater')
    }
  },

  onupdate: function(vnode) {
    if (this.activeApp === vnode.attrs.id) return

    this.activeApp = vnode.attrs.id || null
    if (this.activeApp && this.activeApp !== 'app'&& this.activeApp !== 'manage') {
      return m.route.set('/updater')
    }
    if (this.activeApp && (this.appRepository || this.manageRepository)) {
      this.loadAppData()
    }
    m.redraw()
  },

  socketOpen: function() {
    socket.emit('core.config', {}, (res) => {
      this.appRepository = res.appRepository
      this.manageRepository = res.manageRepository
      if (this.activeApp) {
        this.loadAppData()
      }
      m.redraw()
    })

    socket.on('core.status', (res) => {
      this.status = res
      m.redraw()
    })

    this.on('core.db', (res) => {
      this.db = res
      this.updateActiveDb()
      m.redraw()
    })

    this.on('core.program.log', (res) => {
      this.app.logs = res.logs
      this.logUpdated = true
      m.redraw()
    })


    socket.emit('core.listencore', {})
  },

  updateActiveDb() {
    if (this.db && this.activeApp) {
      this.app = {
        repository: this[this.activeApp + 'Repository'],
        active: this.db[this.activeApp + 'Active'],
        latestInstalled: this.db[this.activeApp + 'LatestInstalled'],
        latestVersion: this.db[this.activeApp + 'LatestVersion'],
        logs: '',
      }
    } else {
      this.app = {}
    }
  },

  loadAppData() {
    this.updateActiveDb()
    if (this.activeApp === 'app') {
      socket.emit('core.listentoapp', {})
    }
    /* request to listen to app updates */
  },

  remove: function() {
    socket.emit('core.unlistencore', {})
    socket.emit('core.unlistentoapp', {})
  },

  startUpdate: function() {
    socket.emit('core.update', {
      name: this.activeApp,
    })
  },

  startSoftware: function() {
    socket.emit('core.start', {
      name: this.activeApp,
    })
  },

  view: function() {
    return m('div#update', [
      m('div.actions', [
        m('h1.header', 'Updater'),
        m('div.filler'),
        m(m.route.Link, {
          hidden: !this.appRepository,
          class: 'button' + (this.activeApp === 'app' ? ' active' : ''),
          href: '/updater/app',
        }, 'Update App'),
        m(m.route.Link, {
          hidden: this.manageRepository,
          class: 'button' + (this.activeApp === 'manage' ? ' active' : ''),
          href: '/updater/manage',
        }, 'Update Manager'),
      ]),
      this.activeApp && this.app ? [
        m('div.info', [
          m('p', this.app.repository
          ? `Repository: ${this.app.repository}`
          : '< no repository >'),
          m('p', this.app.latestInstalled
            ? `Latest installed: ${this.app.latestInstalled}`
            : '< no version installed >'),
          m('p', this.app.active
          ? `Running version: ${this.app.active}`
          : '< no running version >'),
          m('p', this.app.latestVersion
            ? `Latest version: ${this.app.latestVersion}`
            : '< no version found >'),
        ]),
        m('div.console', {
            onupdate: (vnode) => {
              if (this.logUpdated) {
                vnode.dom.scrollTop = vnode.dom.scrollHeight
                this.logUpdated = false
              }
            }
          },
          m('pre', this.app.logs && this.app.logs || '')
        ),
        this.db
          ? m('div.actions', {
              hidden: this.status[this.activeApp + 'Updating'],
            }, [
              m('button', {
                onclick: () => this.startUpdate(),
              }, 'Update & Install'),
              m('button', {
                hidden: this.status[this.activeApp] || !(this.db[this.activeApp + 'LastActive'] || this.db[this.activeApp + 'LatestInstalled']),
                onclick: () => this.startSoftware(),
              }, 'Start'),
              m('button', {
                hidden: !this.db[this.activeApp + 'LastActive']
                    || this.db[this.activeApp + 'LastActive'] === this.db[this.activeApp + 'Active']
              }, 'Use Last Version'),
            ])
          : null,
      ] : null
    ])
  }
})

module.exports = Updater
