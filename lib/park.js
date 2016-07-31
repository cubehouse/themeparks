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

// our Ride object
var Ride = require("./ride");

// default time format for returning times
var DefaultTimeFormat = "YYYY-MM-DDTHH:mm:ssZ";

// park symbols
var s_parkName = Symbol();
var s_parkTimezone = Symbol();
var s_parkGeolocation = Symbol();
var s_parkTimeFormat = Symbol();
var s_useragent = Symbol();
var s_cacheTimeWaitTimes = Symbol();
// track which Ride ID is at which index in our Rides array
var s_rideIDToIDXMap = Symbol();

// ride wait time storage
var s_waitTimeStore = Symbol();

// key for generic cached data
var cacheKey = "themeparks_cache_";
// at end of constructor, generate the cache key for this park and store it privately here
var s_cacheKeyWaitTimes = Symbol();

/**
 * Park class handles all the base logic for all implemented themeparks.
 * All parks should inherit from this base class.
 * Any common functionality is implemented here to save endless re-implementations for each park.
 * @class
 */
class Park {
  /**
   * Create a new Park object
   * @param {Object} options
   * @param {String} options.name The name of this park
   * @param {String} options.timezone Park's timezone
   * @param {String} [options.timeFormat] Format to display park dates in
   * @param {Number} [options.cacheWaitTimesLength=300] How long (in seconds) to cache wait times before fetching fresh time
   * @param {Number} options.latitude Park's latitude
   * @param {Number} options.longitude Park's longitude
   * @param {String} [options.useragent] Useragent to use when making HTTP requests
   */
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

    // cache settings
    //  how long wait times are cached before fetching new data
    this[s_cacheTimeWaitTimes] = options.cacheWaitTimesLength;

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

    // initialise the Rides array
    this.Rides = [];
    // also initialise our ride ID -> idx map
    this[s_rideIDToIDXMap] = {};

    // generate cache keys for this park (use cacheKey, the name of this object, _waittimes)
    this[s_cacheKeyWaitTimes] = `${cacheKey}${this.constructor.name}_waittimes`;
  }

  /**
   * Get waiting times for rides from this park
   * Callback will call with callback(error, data)
   * Data will be null if error is present
   */
  GetWaitTimes(callback) {
    // translate the promise result into a "classic" callback response
    this.GetWaitTimesPromise().then(function(data) {
      callback(null, data);
    }, function(error) {
      callback(error);
    });
  }

  /**
   * Fetch the ride data for the requested ID. If it doesn't exist, add a new ride to our park's ride set
   * @param {Object} ride - Ride data to apply
   * @param {String} ride.id - Ride's ID
   * @param {String} ride.name - Ride's name
   * @returns {Ride} ride - Newly created (or the existing) Ride object
   */
  GetRideObject(ride = {}) {
    if (!ride) throw new Error("No Ride Data supplied to GetRideObject");
    if (ride.id === undefined) throw new Error("No Ride ID supplied to GetRideObject");
    if (ride.name === undefined) throw new Error("No Ride name supplied to GetRideObject");

    // prepend the park's class name to the ID to attempt to ensure uniqueness
    var className = this.constructor.name;
    if (ride.id.substr(0, className.length) !== className) {
      ride.id = `${className}_${ride.id}`;
    }

    // check if we don't already have this ride in our data set
    if (this[s_rideIDToIDXMap][ride.id] === undefined) {

      // new ride! add to our set
      var newRide = new Ride({
        ride_id: ride.id,
        ride_name: ride.name,
      });

      // add our new ride to our ride list and make an ID mapping
      this.Rides.push(newRide);
      this[s_rideIDToIDXMap][ride.id] = this.Rides.length - 1;
    }

    // else, don't worry about it, fail quietly
    // return the already existing ride
    return this.Rides[this[s_rideIDToIDXMap][ride.id]];
  }

  /**
   * Set a new wait time for a ride
   * @param {Object} ride - Ride data to apply
   * @param {String} ride.id - Ride's ID
   * @param {String} ride.name - Ride's name
   * @param {Number} ride.wait_time - Ride's new wait time (set < 0 to signify inactive ride)
   */
  SetRideWaitTime(ride = {}) {
    if (!ride) throw new Error("No Ride Data supplied");
    if (ride.id === undefined) throw new Error("No Ride ID supplied to SetRideWaitTime");
    if (ride.name === undefined) throw new Error("No Ride name supplied to SetRideWaitTime");
    if (ride.wait_time === undefined) throw new Error("No wait time supplied to SetRideWaitTime");

    // set ride's new wait time
    var rideObject = this.GetRideObject(ride);
    rideObject.WaitTime = ride.wait_time;
  }

  /** 
   * Get waiting times for rides from this park
   * @returns {Promise}
   */
  GetWaitTimesPromise() {
    return new Promise(function(resolve, reject) {
      // do we actually support wait times?
      if (!this.SupportsWaitTimes) {
        return reject(`${this.Name} doesn't support fetching wait times`);
      }

      // check our cache first
      Settings.Cache.get(this[s_cacheKeyWaitTimes], function(err, ridedata) {
        if (!err && ridedata) {
          this.Log(`Cache hit for ${this[s_cacheKeyWaitTimes]}!`);

          // we have ridedata from the cache! apply over our current ride data
          for (var i = 0, ride; ride = ridedata[i++];) {
            // restore ride state from cache
            this.GetRideObject(ride).fromJSON(ride);
          }

          // make an array of all the ride states
          var result = [];
          for (var i = 0, ride; ride = this.Rides[i++];) {
            result.push(ride.toJSON());
          }
          return resolve(result);
        }

        // cache missing key or the cached data has expired. Fetch new data!
        this.FetchWaitTimes().then(function() {
          // success! the this.Rides array should now be populated
          //  cache the Rides array and return result
          var result = [];
          for (var i = 0, ride; ride = this.Rides[i++];) {
            result.push(ride.toJSON());
          }

          Settings.Cache.set(this[s_cacheKeyWaitTimes], result, {
            // either use the options.cacheWaitTimesLength or the default cache time length
            ttl: this[s_cacheTimeWaitTimes] || Settings.DefaultCacheWaitTimesLength
          }, function(err) {
            if (err) {
              // if we error, console out, but don't fail (still return data)
              console.error("Error setting cache data for key " + this[s_cacheKeyWaitTimes]);
            }

            // return wait time data
            resolve(result);
          });
        }.bind(this), function(err) {
          // failed to fetch wait times, reject Promise
          return reject(`Error fetching park wait times: ${err}`);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }

  /**
   * Get this park's geolocation object
   * @type {GeoLocation}
   * */
  get Location() {
    return this[s_parkGeolocation];
  }

  /**
   * Get this park's name in a human-readable form
   * @type {String}
   * */
  get Name() {
    return this[s_parkName];
  }

  /**
   * Get this park's useragent string for making network requests
   * This is usually randomly generated on object construction
   * @type {String}
   */
  get UserAgent() {
    return this[s_useragent];
  }

  /**
   * Set this park's useragent
   * Can set user agent to a defined string or use a generator function (see random-useragent library)
   * @type {string|function} 
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
   * @type {String}
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
   * @type {Boolean}
   */
  get FastPass() {
    return false;
  }

  /**
   * Does this park offer wait time information?
   * @type {Boolean}
   */
  get SupportsWaitTimes() {
    // base this logic solely on the presence of a function "FetchWaitTimes" existing
    return this.FetchWaitTimes !== undefined;
  }

  /**
   * Debug print a message (when NODE_DEBUG=themeparks is set in environment)
   * @param {...*} ToPrint Objects/strings to print
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