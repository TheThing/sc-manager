const m = require('mithril')
const socket = require('../socket')
const Module = require('../module')

const Log = Module({
  init: function() {
    this.connected = socket.connected
    this.loglines = []
    this.logUpdated = false
    
    this.on('newlog', data => {
      this.loglines.push(this.formatLine(data))
      this.logUpdated = true
      m.redraw()
    })

    this._socketOn(() => this.loadData())
  },

  remove: function() {
    socket.emit('core.unlistenlogs', {})
  },

  loadData: function() {
    this.loglines = []
    socket.emit('core.listenlogs', {})
    socket.emit('core.getlastlogs', {}, (res) => {
      this.loglines = res.map(this.formatLine)
      this.logUpdated = true
      m.redraw()
    })
  },

  formatLine: function(line) {
    return m.trust(line.replace(/\\033\[37m/g, '<span class="white">')
                       .replace(/\\033\[33m/g, '<span class="yellow">')
                       .replace(/\\033\[36m/g, '<span class="cyan">')
                       .replace(/\\033\[35m/g, '<span class="magenta">')
                       .replace(/\\033\[31m/g, '<span class="red">')
                       .replace(/\\033\[7m/g, '<span class="inverse">')
                       .replace(/\\033\[32m/g, '<span class="green">')
                       .replace(/\\033\[27m/g, '</span>')
                       .replace(/\\033\[39m/g, '</span>'))
  },

  view: function() {
    return [
      m('h1.header', 'Log'),
      m('div#logger', {
        onupdate: (vnode) => {
          if (this.logUpdated) {
            vnode.dom.scrollTop = vnode.dom.scrollHeight
            this.logUpdated = false
          }
        }
      }, [
        this.loglines.map((line, i) => {
          return m('div', { key: i }, line)
        }),
        m('div.padder'),
      ]),
    ]
  }
})

module.exports = Log
