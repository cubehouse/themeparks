"use strict";

// use standard NodeJS debug log function
var util = require("util");
var debugLibName = "themeparks";
var debuglog;

// check util has the debuglog function creator
if (util.debuglog) {
  debuglog = util.debuglog(debugLibName);
} else {
  // if we're on an older version of NodeJS without debuglog, make our own
  //  check our module name is set in NODE_DEBUG
  if (new RegExp('\\b' + debugLibName + '\\b', 'i').test(process.env.NODE_DEBUG)) {
    // just use console.error if we're on an older NodeJS version
    debuglog = function() {
      console.error.apply(this, [debugLibName.toUpperCase(), process.pid].concat(arguments));
    };
  }
}

// just export our debug log function
module.exports = debuglog;