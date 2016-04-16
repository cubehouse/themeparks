// A basic Park object, with common shared logic for all parks
//  All parks should extend this object

// random useragent generator
var random_useragent = require("random-useragent");

// use our debugViewer library to help debug network requests
var debugView = require("./debugView");

// request is a very flexible web request library, supports lots of things!
var request = require("request");

// use standard NodeJS debug log function
var util = require("util");
var debugLibName = "wdwjs";
var debuglog = function() {};

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

// export the main object
module.exports = Park;

function Park(config) {
  var self = this;

  // debugging is disabled by default
  this.debug = config && config.debug || process.env.DEBUG;

  // custom support features
  //  only some parks will support these
  //  parks must mark these as true if they are using these features
  this.supports_ride_schedules = this.supports_ride_schedules || false;

  // park's human-readable name
  this.name = this.name || "Default Blank Park";

  // park date format configurations
  //  see http://momentjs.com/docs/#/displaying/format/
  this.timeFormat = this.timeFormat || "YYYY-MM-DDTHH:mm:ssZ";
  this.dateFormat = this.dateFormat || "YYYY-MM-DD";

  // maximum number of dates to return for a park schedule
  //  Note: Some parks will return less than this
  this.scheduleMaxDates = this.scheduleMaxDates || 30;

  this.park_timezone = this.park_timezone || "America/New_York";

  // timezone to return times in (default to park's timezone)
  this.timeFormatTimezone = this.timeFormatTimezone || this.park_timezone;

  // set user-agent
  if (config && config.useragent) {
    // if useragent is supplied, use that one
    this.useragent = config.useragent;
  } else {
    // otherwise, use a default one
    this.useragent = this.useragent || "Mozilla/5.0 (Linux; U; Android 4.3; en-GB; C6502 Build/10.4.1.B.0.101) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30";
  }

  // Get park wait times for the park
  this.GetWaitTimes = function(callback) {
    // default response, "not implemented" error
    return callback("GetWaitTimes() Not implemented for " + this.name);
  };

  // Get park opening times
  this.GetOpeningTimes = function(callback) {
    // default response, "not implemented" error
    return callback("GetOpeningTimes() Not implemented for " + this.name);
  };

  // Debug print helper function. Calls console.log with all passed arguments
  // if we're in debug mode
  this.Dbg = function() {
    // if no debug variables are set, early-out
    if (!process.env.NODE_DEBUG && !this.debug && !process.env.DEBUGOUT) return;

    var args = ["[Debug :: " + this.name + "]"];
    for (var n in arguments) {
      if (typeof(arguments[n] != "function")) args.push(arguments[n]);
    }

    // pass on debug log to debug viewer if we're in debug mode
    if (process.env.DEBUGOUT || process.env.NODE_DEBUG || this.debug) {
      // pass on debug message to the debug Viewer
      debugView.Log.apply(this, args);
    }

    // skip printing message if we're not in NODE_DEBUG mode
    if (!process.env.NODE_DEBUG && !this.debug) return;

    // if we've manaully requested debug, use console log
    if (this.debug) {
      console.log.apply(this, args);
    } else {
      // ... otherwise, use util debuglog
      debuglog.apply(this, args);
    }
  };

  // Output an error message for debugging
  this.Error = function(message, error, callback) {
    // print error to console nicely
    var args = ["[ERROR :: " + this.name + "]", arguments.callee.caller.name];
    for (var n in arguments) {
      if (typeof(arguments[n]) != "function") args.push(arguments[n]);
    }
    console.error.apply(this, args);

    // callback with only message part of error
    if (callback) return callback(message);
  };

  // Configure a single setting for this park
  this.Config = function(key, value) {
    // cannot override park name
    if (key == "name") return;

    // make sure this is a value we should be able to change
    if (this[key] && typeof(this[key]) != "undefined" && typeof(this[key]) != "function") {
      this.Dbg("Configuring park '" + this.name + "': " + key + " = " + JSON.stringify(value));
      this[key] = value;
    }
  };

  // Configure a park with supplied setting values
  this.Configure = function(config) {
    // call self.Config for each key/value pair
    for (var key in config) {
      this.Config(key, config[key]);
    }
  };

  // Randomise the useragent used by this API, with an optional filter function
  this.RandomiseUseragent = function(filterFunction) {
    // skip if we were manually passed a useragent string
    if (config && config.useragent) return;

    // use random-useragent library to generate
    this.useragent = random_useragent.getRandom(filterFunction);
    this.Dbg("Generated random user-agent for " + this.name + ": " + this.useragent);
  };

  // make a network request, handing over debug information etc. if we need to
  this.MakeNetworkRequest = function(requestObject, callback) {
    self.Dbg("Fetching", requestObject);

    // if no useragent has been set, and we have one defined, set it
    if ((!requestObject.headers || !requestObject.headers['User-Agent']) && self.useragent) {
      if (!requestObject.headers) requestObject.headers = [];
      requestObject.headers["User-Agent"] = self.useragent;
    }

    // make network request using request library
    request(requestObject, function(err, resp, body) {
      // debug log response
      if (process.env.NODE_DEBUG || self.debug || process.env.DEBUGOUT) {
        debugView.RecordHTTPRequest(requestObject.name || requestObject.url || "Unknown URL Request", resp);
      }

      // return request standard response
      return callback(err, resp, body);
    });
  };

  // automatically call configure with the passed in config variable
  if (config) this.Configure(config);
}