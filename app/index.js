/**
 * @license
 * stream-manager <https://filadelfia.is>
 * Copyright 2015 Jonatan Nilsson <http://jonatan.nilsson.is/>
 *
 * Available under WTFPL License (http://www.wtfpl.net/txt/copying/)
*/

'use strict'

//Add debug components to window. Allows us to play with controls
//in the console. 
window.components = {}

require('./socket')

const m = require('mithril')
const Header = require('./header')

const Status = require('./status/status')
const Log = require('./log/log')
const Updater = require('./updater/updater')

m.mount(document.getElementById('header'), Header)

m.route(document.getElementById('content'), '/', {
    '/': Status,
    '/log': Log,
    '/updater': Updater,
    '/updater/:id': Updater,
})
