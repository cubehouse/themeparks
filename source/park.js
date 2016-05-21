"use strict";

import "babel-polyfill";

// source-map support for ES6 compiled code
import 'source-map-support/register'
// our simple geolocation object library
import GeoLocation from './geoLocation.js';
// a basic debug log wrapper
import DebugLog from './debugPrint.js';

// default settings for parks
var DefaultSettings = {
  name: "Default Park",
  timezone: "Europe/London"
};

// park symbols
var s_parkName = Symbol();
var s_parkTimezone = Symbol();
var s_parkGeolocation = Symbol();

// base park class, all other parks should inherit from this
export default class Park {
  constructor(options = {}) {
    // take base variables from the constructor
    //  these variables should be present for all parks
    // what's up with these OR things?
    //  by default, use any manually passed in options
    //  finally, fallback on the default settings
    this[s_parkName] = options.name || DefaultSettings.name;
    this[s_parkTimezone] = options.timezone || DefaultSettings.timezone;
    
    // TODO - validate park's timezone with momentjs.tz

    // create a geolocation object if we've been passed a longitude and latitude
    if (!this[s_parkGeolocation] && options.latitude && options.longitude) {
      this[s_parkGeolocation] = new GeoLocation({
        longitude: options.longitude,
        latitude: options.latitude
      });
    }

    // validate our geolocation object has been created
    if (!this[s_parkGeolocation]) {
      throw new Error(`No park GeoLocation object created for ${this.name}. Please supply longitude and latitude for this park.`);
    }
  }

  /**
   * Get this park's geolocation object
   * @returns {GeoLocation} park location object (see GeoLocation.js)
   */
  get Location() {
    return this[s_parkGeolocation];
  }

  /**
   * Get this park's name in a human-readable form
   * @returns {string} Park name
   */
  get Name() {
    return this[s_parkName];
  }

  /**
   * Get this park's Timezone
   * @returns {string} Park's timezone in TZ format (https://en.wikipedia.org/wiki/Tz_database)
   */
  get Timezone() {
    return this[s_parkTimezone];
  }

  /**
   * Debug print a message
   * @param objects/strings to print
   */
  Log() {
    return DebugLog(`${this.constructor.name}:`, ...arguments);
  }
}