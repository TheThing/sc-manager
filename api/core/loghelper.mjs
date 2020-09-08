import _ from 'lodash'
import { format } from 'util'

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
// Suggested colors (some are unreadable in common cases):
// - Good: cyan, yellow (limited use), bold, green, magenta, red
// - Bad: blue (not visible on cmd.exe), grey (same color as background on
//   Solarized Dark theme from <https://github.com/altercation/solarized>, see
//   issue #160)
var colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Levels
var TRACE = 10;
var DEBUG = 20;
var INFO = 30;
var WARN = 40;
var ERROR = 50;
var FATAL = 60;

var levelFromName = {
    'trace': TRACE,
    'debug': DEBUG,
    'info': INFO,
    'warn': WARN,
    'error': ERROR,
    'fatal': FATAL
};

var upperPaddedNameFromLevel = {};
Object.keys(levelFromName).forEach(function (name) {
    var lvl = levelFromName[name];
    upperPaddedNameFromLevel[lvl] = (
        name.length === 4 ? ' ' : '') + name.toUpperCase();
});

function stylize(str, color) {
  if (!str)
      return '';
  var codes = colors[color];
  if (codes) {
      return '\\033[' + codes[0] + 'm' + str +
                   '\\033[' + codes[1] + 'm';
  } else {
      return str;
  }
}

function indent(s) {
    return '    ' + s.split(/\r?\n/).join('\n    ');
}

export function formatLog(data) {
  let rec = _.cloneDeep(data)

  delete rec.v;

  // Time.
  var time = '[' + rec.time.toISOString().replace('T', ' ').replace('Z', '') + ']'
  time = stylize(time, 'none')

  delete rec.time;

  var nameStr = rec.name;
  delete rec.name;

  if (rec.component) {
      nameStr += '/' + rec.component;
  }
  delete rec.component;

  nameStr += '/' + rec.pid;
  delete rec.pid;

  var level = (upperPaddedNameFromLevel[rec.level] || 'LVL' + rec.level);
  var colorFromLevel = {
      10: 'white',    // TRACE
      20: 'yellow',   // DEBUG
      30: 'cyan',     // INFO
      40: 'magenta',  // WARN
      50: 'red',      // ERROR
      60: 'inverse',  // FATAL
  };
  level = stylize(level, colorFromLevel[rec.level]);
  delete rec.level;

  var src = '';
  if (rec.src && rec.src.file) {
      var s = rec.src;
      if (s.func) {
          src = format(' (%s:%d in %s)', s.file, s.line, s.func);
      } else {
          src = format(' (%s:%d)', s.file, s.line);
      }
      src = stylize(src, 'green');
  }
  delete rec.src;

  var hostname = rec.hostname;
  delete rec.hostname;

  var extras = [];
  var details = [];

  if (rec.req_id) {
      extras.push('req_id=' + rec.req_id);
  }
  delete rec.req_id;

  var onelineMsg;
  if (rec.msg.indexOf('\n') !== -1) {
      onelineMsg = '';
      details.push(indent(stylize(rec.msg, 'cyan')));
  } else {
      onelineMsg = ' ' + stylize(rec.msg, 'cyan');
  }
  delete rec.msg;

  if (rec.err && rec.err.stack) {
      var err = rec.err
      if (typeof (err.stack) !== 'string') {
          details.push(indent(err.stack.toString()));
      } else {
          details.push(indent(err.stack));
      }
      delete err.message;
      delete err.name;
      delete err.stack;
      // E.g. for extra 'foo' field on 'err', add 'err.foo' at
      // top-level. This *does* have the potential to stomp on a
      // literal 'err.foo' key.
      Object.keys(err).forEach(function (k) {
          rec['err.' + k] = err[k];
      })
      delete rec.err;
  }

  var leftover = Object.keys(rec);
  for (var i = 0; i < leftover.length; i++) {
      var key = leftover[i];
      var value = rec[key];
      var stringified = false;
      if (typeof (value) !== 'string') {
          value = JSON.stringify(value, null, 2);
          if (typeof (value) !== 'string') {
              value = 'null'
          }
          stringified = true;
      }
      if (value.indexOf('\n') !== -1 || value.length > 50) {
          details.push(indent(key + ': ' + value));
      } else if (!stringified && (value.indexOf(' ') != -1 ||
          value.length === 0))
      {
          extras.push(key + '=' + JSON.stringify(value));
      } else {
          extras.push(key + '=' + value);
      }
  }

  extras = stylize(
      (extras.length ? ' (' + extras.join(', ') + ')' : ''), 'none');
  details = stylize(
      (details.length ? details.join('\n    --\n') + '\n' : ''), 'none');
  
  return format('%s %s: %s on %s%s:%s%s\n%s',
    time,
    level,
    nameStr,
    hostname || '<no-hostname>',
    src,
    onelineMsg,
    extras,
    details)
}