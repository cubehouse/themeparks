"use strict";

// our simple geolocation object library
var GeoLocation = require('./geoLocation.js');
// a basic debug log wrapper
var DebugLog = require('./debugPrint.js');

// MomentJS time library
var moment = require("moment-timezone");
// random useragent generator
var random_useragent = require("random-useragent");

// load user settings
var Settings = require("./settings");

// default time format for returning times
var DefaultTimeFormat = "YYYY-MM-DDTHH:mm:ssZ";

// park symbols
var s_parkName = Symbol();
var s_parkTimezone = Symbol();
var s_parkGeolocation = Symbol();
var s_parkTimeFormat = Symbol();
var s_useragent = Symbol();

// base park class, all other parks should inherit from this
class Park {
  constructor(options = {}) {
    // can only construct actual parks, not the park object itself
    //  see https://stackoverflow.com/questions/29480569/does-ecmascript-6-have-a-convention-for-abstract-classes
    if (new.target === Park) {
      throw new TypeError("Cannot create Park object directly, only park implementations of Park");
    }

    // take base variables from the constructor
    //  these variables should be present for all parks
    // what's up with these OR things?
    //  by default, use any manually passed in options
    //  finally, fallback on the default settings
    this[s_parkName] = options.name || Settings.DefaultParkName;
    this[s_parkTimezone] = options.timezone || Settings.DefaultParkTimezone;
    this[s_parkTimeFormat] = options.timeFormat || Settings.DefaultParkTimeFormat;

    // validate park's timezone with momentjs
    if (!moment.tz.zone(this[s_parkTimezone])) {
      throw new Error(`Invalid timezone ${this[s_parkTimezone]} passed to park constructor.`);
    }

    // create a geolocation object if we've been passed a longitude and latitude
    if (!this[s_parkGeolocation] && typeof(options.latitude) == "number" && typeof(options.longitude) == "number") {
      this[s_parkGeolocation] = new GeoLocation({
        longitude: options.longitude,
        latitude: options.latitude
      });
    }

    // validate our geolocation object has been created
    if (!this[s_parkGeolocation]) {
      throw new Error(`No park GeoLocation object created for ${this.name}. Please supply longitude and latitude for this park.`);
    }

    // set useragent, or if no useragent has been set, create a random Android one by default
    this.UserAgent = options.useragent || function(ua) {
      return (ua.osName == "Android");
    };
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
   * Get this park's useragent string for making network requests
   * This is usually randomly generated on object construction
   * @returns {string} Current useragent string for making network requets 
   */
  get UserAgent() {
    return this[s_useragent];
  }

  /**
   * Set this park's useragent
   * @param {string|function} useragent set user agent to a defined string or use a generator function (see random-useragent library)
   */
  set UserAgent(useragent = null) {
    if (!useragent) throw new Error("No configuration passed to UserAgent setter");

    if (typeof(useragent) == "function") {
      // generate a useragent using a generator function
      this[s_useragent] = random_useragent.getRandom(useragent);
    } else if (typeof(useragent) == "string") {
      // set useragent using supplied static string
      this[s_useragent] = useragent;
    } else {
      throw new Error("Must define either static user agent string or a generator function");
    }

    this.Log("Set useragent to " + this.UserAgent);
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
  TimeNow({
    timeFormat = null
  } = {}) {
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

  /**
   * Setup park for offline tests. Each park should define URLs to intercept to provide offline unit tests.
   * @returns {bool} Whether offline tests were successfully setup
   */
  SetupOfflineTests() {
    // default park doesn't add any network overrides, implement this per-park

    // return false by default, to ensure parks actually implement this
    return false;
  }
}

// export the Park class
module.exports = Park;