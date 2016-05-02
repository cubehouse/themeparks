//"use strict";

import GeoLocation from './geoLocation.js';
//var GeoLocation = require("./GeoLocation");

console.log(GeoLocation);

// default settings for parks
var DefaultSettings = {
  name: "Default Park",
  timezone: "Europe/London"
};

// base park class, all other parks should inherit from this
class Park {
  constructor(options) {
    // take base variables (optionally) from the constructor
    //  these variables should be present for all parks
    this.name = options.name || DefaultSettings.name;
    this.timezone = options.timezone || DefaultSettings.timezone;
    this.geolocation = new GeoLocation({
      longitude: 10,
      latitude: 10
    });

    console.log("Creating new park " + this.name + " in " + this.timezone);
    console.log("Find park at " + this.geolocation.toGoogleMaps());
  }
}

if (!module || !module.parent) {
  var p = new Park({
    park_name: "Test"
  });
}