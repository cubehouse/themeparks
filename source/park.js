"use strict";

// our simple geolocation object library
import GeoLocation from './geoLocation.js';
// a basic debug log wrapper
import DebugLog from './debugPrint.js';

// MomentJS time library
var moment = require("moment-timezone");

// default settings for parks
var DefaultSettings = {
  name: "Default Park",
  timezone: "Europe/London",
  timeformat: null,
};

// default time format for returning times
var DefaultTimeFormat = "YYYY-MM-DDTHH:mm:ssZ";

// park symbols
var s_parkName = Symbol();
var s_parkTimezone = Symbol();
var s_parkGeolocation = Symbol();
var s_parkTimeFormat = Symbol();

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
    this[s_parkTimeFormat] = options.timeFormat || DefaultSettings.timeFormat;
    
    // validate park's timezone with momentjs
    if (!moment.tz.zone(this[s_parkTimezone])) {
      throw new Error(`Invalid timezone ${this[s_parkTimezone]} passed to park constructor.`);
    }

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
   * */
  get Location() {
    return this[s_parkGeolocation];
  }

  /**
   * Get this park's name in a human-readable form
   * @returns {string} Park name
   * */
  get Name() {
    return this[s_parkName];
  }

  /**
   * Get this park's Timezone
   * @returns {string} Park's timezone in TZ format (https://en.wikipedia.org/wiki/Tz_database)
   * */
  get Timezone() {
    return this[s_parkTimezone];
  }
  
  /**
   * Get park's current time
   * @returns {string} Time as formatted by park's timeformat, or the default timeformat if set to null
   * */
  TimeNow({timeFormat = null} = {}) {
    // take time right now, convert now into park's timezone and format it
    //  format in preferred order of, manually passed in format, park's default time format, or global default time format
    return moment().tz(this.Timezone).format(timeFormat || this[s_parkTimeFormat] || DefaultTimeFormat);
  }
  
  /**
   * Does this park offer fast-pass services?
   * @returns {bool} True if park offers fast-pass services
   */
  get FastPass() {
    return false;
  }

  /**
   * Debug print a message
   * @param objects/strings to print
   * */
  Log() {
    return DebugLog(`${this.constructor.name}:`, ...arguments);
  }
}