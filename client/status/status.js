const m = require('mithril')
const socket = require('../socket')
const Module = require('../module')

const Status = Module({
  init: function() {
    this._name = '...loading...'
    this._management = {
      name: 'manage',
      port: null,
      repository: null,
      active: null,
      latestInstalled: null,
      latestVersion: null,
      running: null,
      updating: null,
      starting: null,
    }
    this._app = {
      name: 'app',
      port: null,
      repository: null,
      active: null,
      latestInstalled: null,
      latestVersion: null,
      running: null,
      updating: null,
      starting: null,
    }

    this._socketOn(() => this.loadData())
  },

  loadData: function() {
    socket.emit('core.config', {}, (res) => {
      this._name = res.name + ' - ' + res.serviceName
      this._app.port = res.port
      this._app.repository = res.appRepository
      this._management.port = res.managePort
      this._management.repository = res.manageRepository
      m.redraw()
    })
    
    this.on('core.db', (res) => {
      this._management.active = res.manageActive
      this._management.latestInstalled = res.manageLatestInstalled
      this._management.latestVersion = res.manageLatestVersion
      this._app.active = res.appActive
      this._app.latestInstalled = res.appLatestInstalled
      this._app.latestVersion = res.appLatestVersion

      m.redraw()
    })

    this.on('core.status', (res) => {
      console.log(res)
      this._management.running = res.manage
      this._management.updating = res.manageUpdating
      this._management.starting = res.manageStarting
      this._app.running = res.app
      this._app.updating = res.appUpdating
      this._app.starting = res.appStarting

      m.redraw()
    })

    socket.emit('core.listencore', {})
  },

  remove: function() {
    socket.emit('core.unlistencore', {})
  },

  restartClicked: function() {
    socket.emit('core.restart', {})
  },

  start: function(name) {
    socket.emit('core.updatestart', {
      name: name,
    })
  },

  getStatus: function(active) {
    if (active.updating) {
      return '< Updating >'
    } else {
      return '< Starting >'
    }
  },

  view: function() {
    let loopOver = [
      ['Management service', '_management'],
      ['Application service', '_app'],
    ]
    return m('div#status', [
      m('h1.header', this._name),
      m('div.split', [
        loopOver.map((group) => {
          return m('div.item', [
            m('h4', group[0]),
            m('p', this[group[1]].port
              ? `Port: ${this[group[1]].port}`
              : ''),
            m('p', this[group[1]].repository
              ? `${this[group[1]].repository}`
              : '< no repository >'),
            m('p', this[group[1]].active
              ? `Running version: ${this[group[1]].active}`
              : '< no running version >'),
            m('p', this[group[1]].latestInstalled
              ? `Latest installed: ${this[group[1]].latestInstalled}`
              : '< no version installed >'),
            m('p', this[group[1]].latestVersion
              ? `Latest version: ${this[group[1]].latestVersion}`
              : '< no version found >'),
            this[group[1]].running !== null && this[group[1]].repository
              ? m('p',
                  { class: this[group[1]].running ? 'running' : 'notrunning' },
                  this[group[1]].running ? 'Running' : 'Not Running'
                )
              : null,
            !this[group[1]].running && (this[group[1]].updating || this[group[1]].starting)
              ? m('div.status', this.getStatus(this[group[1]]))
              : null,
            m('button', {
              hidden: this[group[1]].running || this[group[1]].updating || this[group[1]].starting || !this[group[1]].repository,
              onclick: () => this.start(this[group[1]].name),
            }, 'Update/Start')
          ])
        }),
      ]),
      m('button', {
        onclick: () => this.restartClicked(),
      }, 'Restart service')
    ])
  }
})

module.exports = Status
