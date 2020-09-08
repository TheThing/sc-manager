import * as core from './core/ioroutes.mjs'

function register(ctx, name, method) {
  if (typeof(method) === 'object') {
    Object.keys(method).forEach(key => {
      register(ctx, [name, key].join('.'), method[key])
    })
    return
  }

  ctx.socket.on(name, async function(data, cb) {
    ctx.log.debug('SocketIO: ' + name)

    try {
      await method(ctx, data, cb)
    }
    catch (error) {
      ctx.log.error(error, `Error processing ${name}`)      
    }
  })
}


function onConnection(server, config, db, log, coreService, data) {
  const io = server
  const socket = data

  const child = log.child({
    id: socket.id,
  })

  child.info('Got new socket connection')

  let ctx = {
    config,
    io,
    socket,
    log: child,
    db,
    core: coreService,
    logroot: log,
  }

  ctx.socket.on('disconnect', function() {
    child.info('Closed connection')
  })

  register(ctx, 'core', core)
}

export default onConnection
