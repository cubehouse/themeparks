"use strict";

// A basic Park object, with common shared logic for all parks
//  All parks should extend this object

// export the main object
module.exports = Park;

function Park(config) {
  // debugging is disabled by default
  this.debug = config && config.debug || false;

  // park's human-readable name
  this.name = "Default Blank Park";

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
    if (this.debug) console.log.apply(this, arguments);
  }

  // Configure a single setting for this park
  this.Config = function(key, value) {
    // make sure this is a value we should be able to change
    if (this[key] && typeof(this[key]) != "undefined" && typeof(this[key]) != "function") {
      this.Dbg(" * Configuring park '" + this.name + "': " + key + " = " + JSON.stringify(value));
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

  // automatically call configure with the passed in config variable
  if (config) this.Configure(config);
}