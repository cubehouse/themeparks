"use strict";

// use standard NodeJS debug log function

var util = require("util");
var debug = require("./debug");
var debuglog;

// check util has the debuglog function creator
if (util.debuglog) {
    debuglog = util.debuglog(debug.ModuleName);
} else {
    // if we're on an older version of NodeJS without debuglog, make our own
    //  check our module name is set in NODE_DEBUG
    if (debug.IsDebug) {
        // just use console.error if we're on an older NodeJS version
        debuglog = function debuglog() {
            /* eslint-disable no-console */
            console.error.apply(this, [debug.ModuleName.toUpperCase(), process.pid].concat(arguments));
            /* eslint-enable no-console */
        };
    }
}

// just export our debug log function
module.exports = debuglog;
//# sourceMappingURL=debugPrint.js.map