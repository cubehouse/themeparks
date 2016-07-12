"use strict";

exports.ModuleName = "themeparks";

// set if we're in debug mode or not (done once)
exports.IsDebug = (new RegExp('\\b' + exports.ModuleName + '\\b', 'i').test(process.env.NODE_DEBUG)) ? true : false;