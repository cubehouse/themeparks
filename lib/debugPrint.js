// use standard NodeJS debug log function
const util = require('util');
const debug = require('./debug');

let debuglog;

// check util has the debuglog function creator
if (util.debuglog) {
  debuglog = util.debuglog(debug.ModuleName);
} else if (debug.IsDebug) {
  // just use console.error if we're on an older NodeJS version
  debuglog = () => {
    /* eslint-disable no-console */
    console.error.apply(this, [debug.ModuleName.toUpperCase(), process.pid].concat(arguments));
    /* eslint-enable no-console */
  };
}

// just export our debug log function
module.exports = debuglog;
