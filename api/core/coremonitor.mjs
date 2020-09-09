import { formatLog } from './loghelper.mjs'
import { safeWrap } from '../util.mjs'

export default function coremonitor(io, config, db, log, core) {
  log.on('newlog', safeWrap(log, 'coremonitor.on.newlog', function(data) {
    io.to('logger').emit('newlog', formatLog(data))
  }))
  core.on('dbupdated', safeWrap(log, 'coremonitor.on.dbupdated', function() {
    io.to('core').emit('core.db', db.get('core').value())
  }))
  core.on('statusupdated', safeWrap(log, 'coremonitor.on.statusupdated', function() {
    io.to('core').emit('core.status', core.status())
  }))
  core.on('applog', safeWrap(log, 'coremonitor.on.applog', function(app) {
    io.to('core.app').emit('core.program.log', {
      name: 'app',
      logs: app.logs,
    })
  }))
  core.on('managelog', safeWrap(log, 'coremonitor.on.managelog', function(manage) {
    io.to('core.manage').emit('core.program.log', {
      name: 'manage',
      logs: manage.logs,
    })
  }))
}