// A basic Park object, with common shared logic for all parks
//  All parks should extend this object

// random useragent generator
var random_useragent = require("random-useragent");

// export the main object
module.exports = Park;

function Park(config) {
  // debugging is disabled by default
  this.debug = config && config.debug || process.env.DEBUG;

  // park's human-readable name
  this.name = this.name || "Default Blank Park";

  // park date format configurations
  //  see http://momentjs.com/docs/#/displaying/format/
  this.timeFormat = this.timeFormat || "YYYY-MM-DDTHH:mm:ssZ";
  this.dateFormat = this.dateFormat || "YYYY-MM-DD";

  // maximum number of dates to return for a park schedule
  //  Note: Some parks will return less than this
  this.scheduleMaxDates = this.scheduleMaxDates || 30;

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
    if (!this.debug) return;
    var args = ["[Debug :: " + this.name + "]", arguments.callee.caller.name];
    for (var n in arguments) {
      if (typeof(arguments[n] != "function")) args.push(arguments[n]);
    }
    console.log.apply(this, args);
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

  // automatically call configure with the passed in config variable
  if (config) this.Configure(config);
}