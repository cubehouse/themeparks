// random useragent generator
const RandomUseragent = require('random-useragent');
// Moment lib for time/date management
const Moment = require('moment-timezone');

const Location = require('./location');

// our caching library
const CacheLib = require('./cache');

// Schedule class
const Schedule = require('./schedule');

// Ride class
const Ride = require('./ride');

// load user settings
const Settings = require('./settings');

// wrap the HTTP lib for each park so we automatically pass the User-Agent header nicely along
const HTTPLib = require('./http');

// symbols
const sCacheObject = Symbol('Park Cache');
const sCacheTimeWaitTimes = Symbol('Wait Times Last Cache Time');
const sCacheTimeOpeningTimes = Symbol('Opening Times Last Cache Time');
const sUserAgent = Symbol('Park User Agent');
const sProxyAgent = Symbol('Park Proxy Agent');
const sRideObjects = Symbol('Rides');
const sMemCache = Symbol('Memory Cache');
const sScheduleObject = Symbol('Schedule');
const sScheduleDaysToReturn = Symbol('Schedule Size');

function DefaultUserAgent(ua) {
  return (ua.osName === 'Android');
}

/**
 * Park class handles all the base logic for all implemented themeparks.
 * All parks should inherit from this base class.
 * Any common functionality is implemented here to save endless re-implementations for each park.
 * @class
 */
class Park extends Location {
  /**
   * Create a new Park object
   * @param {Object} options
   * @param {Number} [options.cacheWaitTimesLength=300] How long (in seconds) to cache wait times
   * before fetching fresh data
   * @param {Number} [options.cacheOpeningTimesLength=3600] How long (in seconds) to cache opening
   * times before fetching fresh data
   * @param {String} [options.useragent] Useragent to use when making HTTP requests
   * @param {http.Agent} [options.proxyAgent] A http.Agent object to use as a proxy when making
   * HTTP requests for this park. Eg. https-proxy-agent, or socks-proxy-agent
   */
  constructor(options = {}) {
    super(options);

    // can only construct actual parks, not the park object itself
    //  see http://ilikekillnerds.com/2015/06/abstract-classes-in-javascript/
    if (this.constructor === Park) {
      throw new TypeError('Cannot create Park object directly, only park implementations of Park');
    }

    // cache settings
    //  how long wait times are cached before fetching new data
    this[sCacheTimeWaitTimes] = options.cacheWaitTimesLength || 300;
    this[sCacheTimeOpeningTimes] = options.cacheOpeningTimesLength || 3600;

    // proxy agent to use for HTTP requests
    this[sProxyAgent] = options.proxyAgent || null;

    // set useragent, or if no useragent has been set, create a random Android one by default
    this.UserAgent = options.useragent || DefaultUserAgent;

    // create cache object for this park
    this[sCacheObject] = new CacheLib({
      prefix: this.constructor.name,
    });

    // keep a cache of ride objects (ID => Ride) to return
    this[sRideObjects] = {};

    // keep a small memory cache of responses to avoid hitting sqlite for frequent requests
    this[sMemCache] = {};

    // create new schedule object for this park
    this[sScheduleObject] = new Schedule({
      id: this.constructor.name,
    });

    // how many days to return by default?
    this[sScheduleDaysToReturn] = options.scheduleDaysToReturn || 60;
  }

  /**
   * Get waiting times for rides from this park
   * If the last argument is a function, this will act as a callback.
   *  Callback will call with callback(error, data)
   *  Data will be null if error is present
   * If the last argument is not a function, this will return a Promise.
   */
  GetWaitTimes() {
    // return database cached data
    return this.GetCached('waittimes').then((cachedResponse) => {
      if (cachedResponse !== null) {
        // return cached response if available
        return Promise.resolve(cachedResponse);
      }
      // no cached data? call FetchWaitTimes to fetch fresh data
      return this.FetchWaitTimes().then(() => this.BuildWaitTimesResponse().then(response => this.SetCached('waittimes', response).then(() => Promise.resolve(response))));
    });
  }

  /**
   * Get opening times for this park
   */
  GetOpeningTimes() {
    if (!this.SupportsOpeningTimes) {
      return Promise.reject(new Error(`Park "${this.name}" does not support fetching opening times`));
    }

    // return database cached data
    return this.GetCached('openingtimes').then((cachedResponse) => {
      if (cachedResponse !== null && cachedResponse.length === this[sScheduleDaysToReturn]) {
        return Promise.resolve(cachedResponse);
      }
      return this.FetchOpeningTimes().then(() => this.BuildOpeningTimesResponse().then(response => this.SetCached('openingtimes', response).then(() => Promise.resolve(response))));
    });
  }

  /**
   * How many days are returned by this park's schedule?
   */
  get GetNumScheduleDays() {
    return this[sScheduleDaysToReturn];
  }

  /**
   * Build the Wait Times response from JSON data
   * This will create/fetch Ride objects based on the supplied JSON data
   */
  BuildWaitTimesResponse() {
    // convert all our ride objects into JSON
    const result = [];
    Object.keys(this[sRideObjects]).forEach((rideID) => {
      result.push(this[sRideObjects][rideID].toJSON());
    });
    return Promise.resolve(result);
  }

  /**
   * Update a ride state
   * @param {String} id The ride ID to update
   * @param {Object} options Ride options to update
   */
  UpdateRide(id, options = {}) {
    const rideObject = this.GetRideObject(id);
    rideObject.fromJSON(options);
  }

  /**
   * Find (or create) a ride object with the given ID
   * @param {*} rideId ID to search for/create ride
   */
  GetRideObject(rideId) {
    // prepend park name to ride ID so it is unique across the library
    const className = this.constructor.name;
    const parkPrepended = String(rideId).substr(0, className.length + 1) === `${className}_`;
    const parkRideID = parkPrepended ? rideId : `${className}_${rideId}`;

    // check our local ride cache first
    if (this[sRideObjects][parkRideID] !== undefined) {
      return this[sRideObjects][parkRideID];
    }

    // don't have this locally, create it and store it for later
    this[sRideObjects][parkRideID] = new Ride({
      rideId: parkRideID,
      timezone: this.Timezone,
      forceCreate: true,
    });

    return this[sRideObjects][parkRideID];
  }

  BuildOpeningTimesResponse() {
    // fill in any missing days in the next this[s_scheduleDaysToReturn]+1 days as closed
    const endFillDate = Moment().tz(this.Timezone).add(this[sScheduleDaysToReturn], 'days');
    for (let m = Moment().tz(this.Timezone); m.isBefore(endFillDate); m.add(1, 'day')) {
      const dateData = this.Schedule.GetDate({
        date: m,
      });

      if (dateData === undefined) {
        this.Schedule.SetDate({
          date: m,
          type: 'Closed',
        });
      }
    }

    // resolve with our new schedule data
    return Promise.resolve(this.Schedule.GetDateRange({
      startDate: Moment(),
      endDate: Moment().add(this[sScheduleDaysToReturn], 'days'),
    }));
  }

  GetCached(key) {
    // check memory cache to avoid pointless database reads
    if (this[sMemCache][key] !== undefined) {
      if (this[sMemCache][key].time && this[sMemCache][key].time >= (+new Date())) {
        return Promise.resolve(this[sMemCache][key].data);
      }
    }

    // check last fetch time
    return this.Cache.Get(key);
  }

  SetCached(key, data) {
    // cache in our mini-memory cache for 30 seconds
    this[sMemCache][key] = {
      time: (+new Date()) + (1000 * 30),
      data,
    };

    return this.Cache.Set(key, data, this[sCacheTimeWaitTimes]);
  }

  /**
   * Get this park's raw schedule object
   * @type {Schedule}
   */
  get Schedule() {
    return this[sScheduleObject];
  }

  /**
   * Get this park's useragent string for making network requests
   * This is usually randomly generated on object construction
   * @type {String}
   */
  get UserAgent() {
    return this[sUserAgent];
  }

  /**
   * Set this park's useragent
   * Can set user agent to a defined string or use a generator function
   *  (see random-useragent library)
   * @type {string|function}
   */
  set UserAgent(useragent = null) {
    if (!useragent) throw new Error('No configuration passed to UserAgent setter');

    if (useragent !== this[sUserAgent]) {
      if (typeof useragent === 'function') {
        // generate a useragent using a generator function
        this[sUserAgent] = RandomUseragent.getRandom(useragent);
      } else if (typeof useragent === 'string') {
        // set useragent using supplied static string
        this[sUserAgent] = useragent;
      } else {
        throw new Error('Must define either static user agent string or a generator function');
      }

      this.Log(`Set useragent to ${this.UserAgent}`);
    }
  }

  /* eslint-disable class-methods-use-this */
  /**
   * Does this park offer fast-pass services?
   * @type {Boolean}
   */
  get FastPass() {
    return false;
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  /**
   * Does this park tell you the fast-pass return times?
   * @type {Boolean}
   */
  get FastPassReturnTimes() {
    return false;
  }
  /* eslint-enable class-methods-use-this */

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

  /* eslint-disable class-methods-use-this */
  /**
   * Does this park offer opening times for rides?
   * @type {Boolean}
   */
  get SupportsRideSchedules() {
    return false;
  }
  /* eslint-enable class-methods-use-this */

  /**
   * Make an HTTP request using this park's user agent and HTTP settings
   */
  HTTP(options) {
    const HTTPOptions = options;

    if (!HTTPOptions) return Promise.reject(new Error('No HTTP options passed!'));
    if (!HTTPOptions.headers) HTTPOptions.headers = {};
    if (!HTTPOptions.headers['User-Agent']) HTTPOptions.headers['User-Agent'] = this.UserAgent;

    // some default timeout settings for needle
    if (!HTTPOptions.open_timeout) HTTPOptions.open_timeout = Settings.OpenTimeout;
    if (!HTTPOptions.read_timeout) HTTPOptions.read_timeout = Settings.ReadTimeout;

    // use a proxy agent, is supplied
    if (this[sProxyAgent] !== null) {
      HTTPOptions.agent = this[sProxyAgent];
    }

    // pass on options to HTTP lib and return
    return HTTPLib(HTTPOptions);
  }

  /**
   * Get the cache object for this park
   * @returns {Cache}
   */
  get Cache() {
    return this[sCacheObject];
  }
}

module.exports = Park;
