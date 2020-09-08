const m = require('mithril')
const socket = require('../socket')
const Module = require('../module')

const Status = Module({
  init: function() {
    this._name = '...loading...'
    this._management = {
      port: null,
      repository: null,
      active: null,
      latestInstalled: null,
      lastActive: null,
      latestVersion: null,
      running: null,
    }
    this._app = {
      port: null,
      repository: null,
      active: null,
      latestInstalled: null,
      lastActive: null,
      latestVersion: null,
      running: null,
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
      this._management.lastActive = res.manageLastActive
      this._management.latestVersion = res.manageLatestVersion
      this._app.active = res.appActive
      this._app.latestInstalled = res.appLatestInstalled
      this._app.lastActive = res.appLastActive
      this._app.latestVersion = res.appLatestVersion

      m.redraw()
    })

    this.on('core.status', (res) => {
      this._management.running = res.manage
      this._app.running = res.app

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
            m('p', this[group[1]].lastActive
              ? `Last stable version: ${this[group[1]].lastActive}`
              : '< no last stable version >'),
            m('p', this[group[1]].latestVersion
              ? `Latest version: ${this[group[1]].latestVersion}`
              : '< no version found >'),
            this[group[1]].running !== null
              ? m('p',
                  { class: group[1].running ? 'running' : 'notrunning' },
                  group[1].running ? 'Running' : 'Not Running'
                )
              : null,
            m('button', {
              
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
