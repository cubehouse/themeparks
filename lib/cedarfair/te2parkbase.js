const Moment = require('moment-timezone');
const Park = require('../park');

const sParkID = Symbol('Park ID');
const sAuthToken = Symbol('Authentication Token String');
const sApiBase = Symbol('Park API Base URL');
const sRideTypes = Symbol('Ride Types to return');

// this used to be "SeaWorld Park" base, but now it seems SeaWorld have dropped TE2, so refactor this for their other clients.

/**
 * Implements the The Experience Engine API framework.
 * @class
 * @extends Park
 */
class TE2Park extends Park {
  /**
   * Create new TE2Park Object.
   * This object should not be called directly, but rather extended for each of the individual TE2 parks
   * @param {Object} options
   * @param {String} options.park_id ID of the park to access the API for
   * @param {String} [options.auth_token] Auth token to use to connect to the API
   * @param {String} [options.api_base] Base URL to access the API
   * @param {String[]} [options.ride_types] Array of types that denote rides at the park (to avoid listing restaurants/toilets etc. as rides)
   */
  constructor(options = {}) {
    options.name = options.name || 'TE2 Park';

    // inherit from base class
    super(options);

    // assign park configurations
    if (!options.park_id) throw new Error("Missing park's API ID");
    this[sParkID] = options.park_id;

    // accept API options to override defaults if needed
    this[sAuthToken] = options.auth_token || '***REMOVED***';
    this[sApiBase] = options.api_base || 'https://seas.te2.biz/v1/rest/';

    // array of valid ride types. Some implementations of the API use various types to declare rides (eg. Family/Kid/Thrill etc.)
    this[sRideTypes] = options.ride_types || ['Ride', 'Coasters', 'Family', 'ThrillRides', 'Kids'];
  }

  FetchWaitTimes() {
    // first make sure we have our ride names
    return this.GetRideNames().then(rideNames => this.GetAPIUrl({
      url: `${this[sApiBase]}venue/${this[sParkID]}/poi/all/status`,
      mock: `${this.ParkID}_poistatus`,
    }).then((waitTimeData) => {
      waitTimeData.forEach((ride) => {
        // find/create this ride object (only if we have a name for it)
        if (rideNames[ride.id]) {
          let waittime = -1;

          if (ride.status) {
            // update ride wait time
            if (ride.status.waitTime) {
              waittime = ride.status.waitTime;
            } else {
              waittime = ride.status.isOpen ? 0 : -1;
            }
          }

          this.UpdateRide(ride.id, {
            name: rideNames[ride.id],
            waitTime: waittime,
          });
        }
      });

      return Promise.resolve();
    }));
  }

  FetchOpeningTimes() {
    return this.GetAPIUrl({
      url: `${this[sApiBase]}venue/${this[sParkID]}/hours/${Moment().tz(this.Timezone).format('YYYY-MM-DD')}`,
      data: {
        days: 30,
      },
      mock: `${this.ParkID}_hours`,
    }).then((scheduleData) => {
      scheduleData.forEach((day) => {
        const thisDay = Moment(day.date, 'YYYY-MM-DD');
        this.Schedule.SetDate({
          date: thisDay,
          openingTime: day.open ? Moment(day.open, 'YYYY-MM-DDTHH:mm:ss.SSSZZ').tz(this.Timezone) : thisDay,
          closingTime: day.close ? Moment(day.close, 'YYYY-MM-DDTHH:mm:ss.SSSZZ').tz(this.Timezone) : thisDay,
          type: day.isOpen ? 'Operating' : 'Closed',
        });
      });

      return Promise.resolve();
    });
  }

  /**
   * Get cached (or fresh fetch) of ride names
   * @returns {Promise<Object>} Object of RideID => Ride name in English
   */
  GetRideNames() {
    // wrap cache request (cache ride names for 24 hours)
    return this.Cache.Wrap('ridenames', this.FetchRideNames.bind(this), 60 * 60 * 24);
  }

  /**
   * Fetch all the rides and ride names for this park from the API (skip the cache)
   * @returns {Promise<Object>} Object of RideID => Ride name in English
   */
  FetchRideNames() {
    this.Log(`Fetching ride names for ${this.Name}`);

    // fetch POI (points-of-interest) data from API
    return this.GetAPIUrl({
      url: `${this[sApiBase]}venue/${this[sParkID]}/poi/all`,
      mock: `${this.ParkID}_poi`,
    }).then((rideData) => {
      if (!rideData) return Promise.reject(new Error('No POI data returned from TE2 API'));

      const rideNames = {};
      rideData.forEach((poi) => {
        // only include POI data for rides
        if (this[sRideTypes].indexOf(poi.type) >= 0) {
          // grab "label", which is the English title for each POI
          rideNames[poi.id] = poi.label;
        }
      });

      return Promise.resolve(rideNames);
    });
  }

  GetAPIUrl(requestObject) {
    // make sure headers exist if they weren't set already
    if (!requestObject.headers) requestObject.headers = [];
    requestObject.headers.Authorization = `Basic ${Buffer.from(this[sAuthToken]).toString('base64')}`;

    // make sure we get JSON back
    requestObject.forceJSON = true;

    // send network request
    return this.HTTP(requestObject);
  }

  /**
   * Get the park ID used by the SeaWorld/Cedar Fair API
   * @type {String}
   * */
  get ParkID() {
    return this[sParkID];
  }

  /**
   * Get this park's API Base URL
   * @type {String}
   * */
  get APIBase() {
    return this[sApiBase];
  }
}

module.exports = TE2Park;
