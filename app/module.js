const defaults = require('./defaults')
const socket = require('./socket')

module.exports = function Module(module) {
  return defaults(module, {
    init: function() {},

    oninit: function(vnode) {
      this._listeners = []
      this.init(vnode)
    },

    _listeners: null,

    _socketOn: function(cb) {
      socket.on('connect', () => cb())

      if (socket.connected) {
        cb()
      }
    },

    on: function(name, cb) {
      this._listeners.push([name, cb])
      socket.on(name, cb)
    },

    remove: function() {},

    onremove: function() {
      this.remove()
      if (!this._listeners) return
      for (let i = 0; i < this._listeners.length; i++) {
        socket.removeListener(this._listeners[0], this._listeners[1])
      }
    },
  })
}
