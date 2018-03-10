"use strict";

// our simple geolocation object library
var GeoLocation = require("./geoLocation.js");
// a basic debug log wrapper
var DebugLog = require("./debugPrint.js");

// include our Promise library
var Promise = require("./promise");

// MomentJS time library
var moment = require("moment-timezone");
// random useragent generator
var random_useragent = require("random-useragent");

// load user settings
var Settings = require("./settings");

// wrap the HTTP lib for each park so we automatically pass the User-Agent header nicely along
var HTTPLib = require("./http");

// our caching library, each park will get it's own cache object
var CacheLib = require("./cache");

// our Ride object
var Ride = require("./ride");
// our Schedule class
var Schedule = require("./schedule");

// default time format for returning times
var DefaultTimeFormat = "YYYY-MM-DDTHH:mm:ssZ";

var SocksProxyAgent = require("socks-proxy-agent");
var HttpsProxyAgent = require("https-proxy-agent");

// park symbols
var s_parkName = Symbol();
var s_parkTimezone = Symbol();
var s_parkGeolocation = Symbol();
var s_parkTimeFormat = Symbol();
var s_parkDateFormat = Symbol();
var s_useragent = Symbol();
var s_cacheTimeWaitTimes = Symbol();
var s_cacheTimeOpeningTimes = Symbol();
// track which Ride ID is at which index in our Rides array
var s_rideIDToIDXMap = Symbol();
// key for our schedule data
var s_scheduleData = Symbol();
// how many days to return for opening time schedules
var s_scheduleDaysToReturn = Symbol();

// our cache object
var s_cacheObject = Symbol();

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
     * @param {String} [options.timeFormat] Format to display park times in
     * @param {String} [options.dateFormat] Format to display park dates in
     * @param {Number} [options.cacheWaitTimesLength=300] How long (in seconds) to cache wait times before fetching fresh time
     * @param {Number} options.latitude Park's latitude
     * @param {Number} options.longitude Park's longitude
     * @param {String} [options.useragent] Useragent to use when making HTTP requests
     * @param {Number} [options.scheduleDaysToReturn] Days of opening times to return with GetOpeningTimes()
     */
    constructor(options = {}) {
        // can only construct actual parks, not the park object itself
        //  see http://ilikekillnerds.com/2015/06/abstract-classes-in-javascript/
        if (this.constructor === Park) {
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
        this[s_parkDateFormat] = options.dateFormat || Settings.DefaultDateFormat;

        // cache settings
        //  how long wait times are cached before fetching new data
        this[s_cacheTimeWaitTimes] = options.cacheWaitTimesLength;
        this[s_cacheTimeOpeningTimes] = options.cacheOpeningTimesLength;

        // how many schedule days to return?
        this[s_scheduleDaysToReturn] = options.scheduleDaysToReturn || Settings.DefaultScheduleDays;

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

        // make a new schedule object for storing park opening hours in
        this[s_scheduleData] = new Schedule({
            timeFormat: this[s_parkTimeFormat],
            dateFormat: this[s_parkDateFormat],
        });

        // create cache object for this park
        this[s_cacheObject] = new CacheLib({
            prefix: this.constructor.name
        });
    }

    /**
     * Get waiting times for rides from this park
     * If the last argument is a function, this will act as a callback.
     *  Callback will call with callback(error, data)
     *  Data will be null if error is present
     * If the last argument is not a function, this will return a Promise.
     */
    GetWaitTimes() {
        var callback = arguments[arguments.length - 1];
        // if our last argument is a function, use it as a callback
        if (typeof callback == "function") {
            // translate the promise result into a "classic" callback response
            this.GetWaitTimesPromise().then(function(data) {
                callback(null, data);
            }.bind(this), function(error) {
                callback(error);
            }.bind(this));
            // otherwise, return a Promise object
        } else {
            return this.GetWaitTimesPromise();
        }
    }

    /**
     * Fetch the ride data for the requested ID. If it doesn't exist, add a new ride to our park's ride set
     * @param {Object} ride - Ride data to apply
     * @param {String} ride.id - Ride's ID
     * @param {String} ride.name - Ride's name
     * @returns {Ride} ride - Newly created (or the existing) Ride object
     */
    GetRideObject(ride = {}) {
        if (!ride) {
            this.Log("No Ride Data supplied to GetRideObject");
            return null;
        }
        if (ride.id === undefined) {
            this.Log("No Ride ID supplied to GetRideObject", ride);
            return null;
        }
        if (ride.name === undefined) {
            this.Log("No Ride name supplied to GetRideObject", ride);
            return null;
        }

        // prepend the park's class name to the ID to attempt to ensure uniqueness
        var className = this.constructor.name;
        if (String(ride.id).substr(0, className.length) !== className) {
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
     * Fetch the ride data for the requested ID. If it doesn't exist, returns null
     * @param {Object} ride - Ride data to search for
     * @param {String} ride.id - Ride's ID
     * @returns {Ride} ride - Existing Ride object (or null if it doesn't exist)
     */
    FindRideObject(ride = {}) {
        if (!ride) {
            this.Log("No Ride Data supplied to FindRideObject");
            return null;
        }
        if (ride.id === undefined) {
            this.Log("No Ride ID supplied to FindRideObject", ride);
            return null;
        }

        // prepend the park's class name to the ID to attempt to ensure uniqueness
        var className = this.constructor.name;
        if (String(ride.id).substr(0, className.length) !== className) {
            ride.id = `${className}_${ride.id}`;
        }

        // check if we have this ride yet
        if (this[s_rideIDToIDXMap][ride.id] === undefined) {
            return null;
        }

        // return the already existing ride
        return this.Rides[this[s_rideIDToIDXMap][ride.id]];
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
            this.Cache.Get("waittimes").then(function(ridedata) {
                // we have ridedata from the cache! apply over our current ride data
                for (var i = 0, ride; ride = ridedata[i++];) {
                    // restore ride state from cache
                    this.GetRideObject(ride).fromJSON(ride);
                }

                // make an array of all the ride states
                var result = [];
                for (i = 0; ride = this.Rides[i++];) {
                    result.push(ride.toJSON());
                }
                return resolve(result);
            }.bind(this), function(err) {
                if (err) {
                    this.Log(`Error fetching cached wait times: ${err}`);
                }

                // cache missing key or the cached data has expired. Fetch new data!
                this.FetchWaitTimes().then(function() {
                    // success! the this.Rides array should now be populated
                    //  cache the Rides array and return result
                    var result = [];
                    for (var i = 0, ride; ride = this.Rides[i++];) {
                        result.push(ride.toJSON());
                    }

                    this.Cache.Set("waittimes", result, {
                        // either use the options.cacheWaitTimesLength or the default cache time length
                        ttl: this[s_cacheTimeWaitTimes] || Settings.DefaultCacheWaitTimesLength
                    }).then(function() {
                        resolve(result);
                    }.bind(this), reject);
                }.bind(this), function(err) {
                    // failed to fetch wait times, reject Promise
                    return reject(`Error fetching park wait times: ${err}`);
                }.bind(this));
            }.bind(this));
        }.bind(this));
    }

    /**
     * Get opening times for this park
     * If the last argument is a function, this will act as a callback.
     *  Callback will call with callback(error, data)
     *  Data will be null if error is present
     * If the last argument is not a function, this will return a Promise.
     */
    GetOpeningTimes() {
        var callback = arguments[arguments.length - 1];
        // if our last argument is a function, use it as a callback
        if (typeof callback == "function") {
            // translate the promise result into a "classic" callback response
            this.GetOpeningTimesPromise().then(function(data) {
                callback(null, data);
            }.bind(this), function(error) {
                callback(error);
            }.bind(this));
            // otherwise, return a Promise object
        } else {
            return this.GetOpeningTimesPromise();
        }
    }

    /** 
     * Get opening times for this park
     * @returns {Promise}
     */
    GetOpeningTimesPromise() {
        return new Promise(function(resolve, reject) {
            // do we actually support opening times?
            if (!this.SupportsOpeningTimes) {
                return reject(`${this.Name} doesn't support fetching opening times`);
            }

            // check our cache first
            this.Cache.Get("openingtimes").then(function(openingTimesData) {
                // restore schedule from cached data
                this[s_scheduleData].fromJSON(openingTimesData);

                // fetch date range to return
                return resolve(this[s_scheduleData].GetDateRange({
                    startDate: moment(),
                    endDate: moment().add(this.ScheduleDays, "days"),
                }));
            }.bind(this), function() {
                // cache missing key or the cached data has expired. Fetch new data!
                this.FetchOpeningTimes().then(function() {
                    // fill in any missing days in the next period as closed
                    var endFillDate = moment().tz(this.Timezone).add(this.ScheduleDays + 90, "days");
                    for (var m = moment().tz(this.Timezone); m.isBefore(endFillDate); m.add(1, "day")) {
                        var dateData = this.Schedule.GetDate({
                            date: m
                        });
                        if (!dateData) {
                            this.Schedule.SetDate({
                                date: m,
                                type: "Closed"
                            });
                        }
                    }

                    // resolve with our new schedule data
                    resolve(this[s_scheduleData].GetDateRange({
                        startDate: moment(),
                        endDate: moment().add(this.ScheduleDays, "days"),
                    }));

                    // if the data is now dirty, cache it
                    if (this[s_scheduleData].IsDirty) {
                        // save schedule data in cache
                        this.Cache.Set("openingtimes", this[s_scheduleData].toJSON(), {
                            // either use the options.s_cacheTimeOpeningTimes or the default cache time length
                            ttl: this[s_cacheTimeOpeningTimes] || Settings.DefaultCacheOpeningTimesLength
                        }, function(err) {
                            if (err) {
                                // if we error, console out, but don't fail (still return data)
                                this.Log(`Error setting cache data for ${this.Name}`);
                            }

                            // mark data as no longer dirty (no longer needs caching)
                            this[s_scheduleData].IsDirty = false;
                        }.bind(this));
                    }
                }.bind(this), function(err) {
                    // failed to fetch opening times, reject Promise
                    return reject(`Error fetching park opening times: ${err}`);
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
     * @param {Object} timeFormatObject
     * @param {String} [timeFormatObject.timeFormat] Moment JS format string to format time as 
     * @returns {String} Time as formatted by park's timeformat, or the default timeformat if set to null
     * */
    TimeNow({
        timeFormat = null
    } = {}) {
        // take time right now, convert now into park's timezone and format it
        //  format in preferred order of, manually passed in format, park's default time format, or global default time format
        return moment().tz(this.Timezone).format(timeFormat || this[s_parkTimeFormat] || DefaultTimeFormat);
    }

    /**
     * Get park's current date
     * @param {Object} dateFormatObject
     * @param {String} [dateFormatObject.dateFormat] Moment JS format string to format date as 
     * @returns {String} Date as formatted by park's dateFormat, or the default dateFormat if set to null
     * */
    DateNow({
        dateFormat = null
    } = {}) {
        // we're just calling the TimeNow function with a date formate string instead
        return this.TimeNow({
            timeFormat: dateFormat || this[s_parkDateFormat]
        });
    }

    /**
     * Get the park's raw schedule object
     * @returns {Schedule} Schedule object for this park's opening times
     */
    get Schedule() {
        return this[s_scheduleData];
    }

    /**
     * Get how many days the fetched schedule is expected to be
     */
    get ScheduleDays() {
        return this[s_scheduleDaysToReturn];
    }

    /**
     * Does this park offer fast-pass services?
     * @type {Boolean}
     */
    get FastPass() {
        return false;
    }

    /**
     * Does this park tell you the fast-pass return times?
     * @type {Boolean}
     */
    get FastPassReturnTimes() {
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
     * Does this park offer opening time information?
     * @type {Boolean}
     */
    get SupportsOpeningTimes() {
        // base this logic solely on the presence of a function "FetchOpeningTimes" existing
        return this.FetchOpeningTimes !== undefined;
    }

    /**
     * Does this park offer opening times for rides?
     * @type {Boolean}
     */
    get SupportsRideSchedules() {
        return false;
    }

    /**
     * Make an HTTP request using this park's user agent
     */
    HTTP(options) {
        if (!options) return Promise.reject("No HTTP options passed!");
        if (!options.headers) options.headers = {};
        if (!options.headers["User-Agent"]) options.headers["User-Agent"] = this.UserAgent;

        if (!options.open_timeout) options.open_timeout = Settings.DefaultOpenTimeout;
        if (!options.read_timeout) options.read_timeout = Settings.DefaultReadTimeout;

        // Use proxy agent if defined in settings
        if (Settings.ProxyURL) {
            if (Settings.ProxyURL.startsWith("socks://")) {
                options.agent = new SocksProxyAgent(Settings.ProxyURL, true);
            } else if (Settings.ProxyURL.startsWith("https://")) {
                options.agent = new HttpsProxyAgent(Settings.ProxyURL, true);
            }
        }

        // pass on options to HTTP lib
        return HTTPLib(options);
    }

    /**
     * Get the cache object for this park
     * @returns {Cache}
     */
    get Cache() {
        return this[s_cacheObject];
    }

    /**
     * Debug print a message (when NODE_DEBUG=themeparks is set in environment)
     * @param {...*} ToPrint Objects/strings to print
     * */
    Log() {
        return DebugLog(`${this.constructor.name}:`, ...arguments);
    }
}

// export the Park class
module.exports = Park;