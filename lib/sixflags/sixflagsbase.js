const Moment = require('moment-timezone');
const Park = require('../park');

const sParkID = Symbol('Park ID');
const sAuthToken = Symbol('Auth Token');
const sBaseURL = Symbol('Base API URL');
const sApiVersion = Symbol('API Version');

/**
 * Implements the SixFlags API framework.
 * @class
 * @extends Park
 */
class SixFlagsPark extends Park {
  /**
   * Create new SixFlagsPark Object.
   * This object should not be called directly, but rather extended for each of the individual SixFlags parks
   * @param {Object} options
   * @param {String} options.park_id
   * @param {String} [options.auth_token] Auth token for logging into the SixFlags API
   * @param {String} [options.api_url] URL for accessing the SixFlags API (default: https://api.sixflags.net/)
   * @param {String} [options.api_version] API version (default: 6)
   */
  constructor(options = {}) {
    options.name = options.name || 'SixFlags Park';

    // inherit from base class
    super(options);

    // assign park configurations
    if (!options.park_id) throw new Error("Missing park's API ID");
    this[sParkID] = options.park_id;

    this[sAuthToken] = options.auth_token || 'MEExQ0RGNjctMjQ3Ni00Q0IyLUFCM0ItMTk1MTNGMUY3NzQ3Ok10WEVKU0hMUjF5ekNTS3FBSVZvWmt6d2ZDUUFUNEIzTVhIZ20rZVRHU29xSkNBRDRXUHlIUnlYK0drcFZYSHJBNU9ZdUFKRHYxU3p3a3UxWS9sM0Z3PT0=';
    this[sBaseURL] = options.api_url || 'https://api.sixflags.net/';
    this[sApiVersion] = options.api_version || '7';
  }

  /**
   * Get the API base URL for making API requests
   * @returns {String} Base URL for the park's API (eg. https://api.sixflags.net/api/v6/)
   */
  get APIBase() {
    return `${this[sBaseURL]}api/v${this[sApiVersion]}/`;
  }

  // override this from the base class to declare this park supports a FastPass-style service
  get FastPass() {
    return true;
  }

  FetchWaitTimes() {
    return this.GetRideNames().then(rideNames => this.GetAPIUrl({
      url: `${this.APIBase}park/${this[sParkID]}/rideStatus`,
    }).then((rideData) => {
      if (!rideData || !rideData.rideStatuses) return Promise.reject(new Error('Missing ridestatuses from API response'));

      // loop over rides
      rideData.rideStatuses.forEach((ride) => {
        if (rideNames[ride.rideId]) {
          let rideWaitTime = null;
          let rideStatus;
          if (ride.status === 'AttractionStatusOpen') {
            rideStatus = 'Operating';
            rideWaitTime = parseInt(ride.waitTime, 10) || null;
          } else if (ride.status === 'AttractionStatusClosed') {
            rideStatus = 'Closed';
            rideWaitTime = -1;
          } else if (ride.status === 'AttractionStatusTemporarilyClosed') {
            rideStatus = 'Down';
            rideWaitTime = -2;
          } else if (ride.status === 'AttractionStatusClosedForSeason') {
            rideStatus = 'Closed';
            rideWaitTime = -1;
          } else if (ride.status === 'AttractionStatusComingSoon') {
            rideStatus = 'Closed';
            rideWaitTime = -3;
          } else {
            this.Log('Unknown ride status for SixFlags park', ride.status);
            rideStatus = 'Down';
            rideWaitTime = -1;
          }

          this.UpdateRide(ride.rideId, {
            status: rideStatus,
            waitTime: rideWaitTime,
            name: rideNames[ride.rideId],
          });
        }
      });

      return Promise.resolve();
    }));
  }

  FetchOpeningTimes() {
    return this.GetAPIUrl({
      url: `${this.APIBase}park/${this[sParkID]}/hours`,
    }).then((scheduleData) => {
      if (scheduleData.message && scheduleData.message === 'No operating hours found for this park') {
        // edge-case! park is closed forever! (or not open yet)
        return Promise.resolve();
      }

      if (!scheduleData.operatingHours) return Promise.reject(new Error('No operating hours returned by park'));

      scheduleData.operatingHours.forEach((day) => {
        const thisDay = Moment(day.operatingDate, 'YYYY-MM-DDTHH:mm:ss');
        this.Schedule.SetDate({
          openingTime: day.open ? Moment.tz(day.open, 'YYYY-MM-DDTHH:mm:ss', this.Timezone) : thisDay,
          closingTime: day.close ? Moment.tz(day.close, 'YYYY-MM-DDTHH:mm:ss', this.Timezone) : thisDay,
          type: 'Operating',
        });
      });

      return Promise.resolve();
    });
  }

  /**
   * Get an access token for making Six Flags API requests
   */
  GetAccessToken() {
    // default ttl for an access token (in case we don't get an expirey time correctly)
    let ttl = 60 * 30;

    return this.Cache.Wrap('accesstoken', () => this.HTTP({
      url: `${this[sBaseURL]}Authentication/identity/connect/token`,
      method: 'POST',
      headers: {
        Authorization: `Basic ${this[sAuthToken]}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: {
        grant_type: 'client_credentials',
        scope: 'mobileApp',
      },
      forceJSON: true,
    }).then((body) => {
      if (!body) return Promise.reject(new Error('No body returned for access token'));
      if (!body.access_token) return Promise.reject(new Error('No access_token returned'));

      this.Log('Fetched access token', body.access_token);

      ttl = body.expires_in || 60 * 30;

      return Promise.resolve(body.access_token);
    }), () => Promise.resolve(ttl));
  }

  /**
   * Get rides names for all the rides in this park
   * This is either fetched from cache or fresh from the API if not fetched for a while
   * @returns {Promise<Object>} Object of Ride IDs => Ride Names
   */
  GetRideNames() {
    return this.Cache.Wrap('rides', () => this.GetAPIUrl({
      url: `${this.APIBase}park/${this[sParkID]}/ride`,
    }).then((body) => {
      if (!body) return Promise.reject(new Error('No body recieved'));
      if (!body.rides) return Promise.reject(new Error('No rides returned'));

      // interesting fields
      //  name
      //  location.latitude
      //  location.longitude
      //  location.radius
      //  rides
      //  waitTimesLastUpdated

      const rideNames = {};
      body.rides.forEach((ride) => {
        // interesting fields
        //  isFlashPassEligible
        //  status
        //  waitTime
        rideNames[ride.rideId] = ride.name;
      });

      return Promise.resolve(rideNames);
    }), 60 * 60 * 12);
  }

  GetAPIUrl(requestObject) {
    // grab an access token first
    return this.GetAccessToken().then((accessToken) => {
      // make sure headers exist if they weren't set already
      if (!requestObject.headers) requestObject.headers = [];
      requestObject.headers['Accept-Language'] = 'en-US';
      requestObject.headers.Connection = 'Keep-Alive';
      requestObject.headers.Authorization = `Bearer ${accessToken}`;

      // make sure we get JSON back
      requestObject.forceJSON = true;

      // send network request
      return this.HTTP(requestObject);
    });
  }
}

module.exports = SixFlagsPark;
