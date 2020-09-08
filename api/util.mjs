export function safeWrap(log, name, fn) {
  return function(data, cb) {
    try {
      let out = fn(data, cb)
      if (out && out.then) {
        out.then(function() {}, function(err) {
          log.error(err, 'Unknown error in ' + name)
          log.event.error('Unknown error occured in ' + name + ': ' + err.message)
        })
      }
    } catch (err) {
      log.error(err, 'Unknown error in ' + name)
      log.event.error('Unknown error occured in ' + name + ': ' + err.message)
    }
  }
}