import ServiceCore from 'service-core'
import * as server from './index.mjs'

const serviceCore = new ServiceCore('sc-manager', import.meta.url)

serviceCore.init(server)
  .then(function() {})
  .catch(function(err) {
    serviceCore.log.error(err, 'Unknown error starting server')
  })
