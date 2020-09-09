export function start(config, db, log, core, http, port) {
  return import('./api/server.mjs').then(function(module) {
    return module.run(config, db, log, core, http, port)
  })
}