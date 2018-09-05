// include core Park class
const Moment = require('moment-timezone');

// crypto lib for generating access token signature
const crypto = require('crypto');
const Park = require('../park');

// API settings
const apiBaseURL = 'https://services.universalorlando.com/api/';
const apiAppKey = 'AndroidMobileApp';
const apiAppSecret = 'AndroidMobileAppSecretKey182014';

const sParkID = Symbol('Park ID');
const sCity = Symbol('City ID');

// park IDs:
//  Studios: 10010
//  Islands: 10000
//  CityWalk: 10011
//  Wet 'N Wild: 45084

/**
 * Implements the Universal API framework. All Universal parks use this one API.
 * @class
 * @extends Park
 */
class UniversalPark extends Park {
  /**
   * Create new UniversalPark Object.
   * This object should not be called directly, but rather extended for each of the individual Universal parks
   * @param {Object} options
   * @param {String} options.park_id Universal API park ID
   */
  constructor(options = {}) {
    options.name = options.name || 'Universal Park';

    // Universal parks return lots of opening time data, return a few months of data by default
    options.scheduleDaysToReturn = options.scheduleDaysToReturn || 90;

    // inherit from base class
    super(options);

    // grab Universal API configs for this park instance
    if (!options.parkId) throw new Error('Missing park\'s API ID');
    this[sParkID] = options.parkId;

    // universal hollywood uses ?city= on it's API requests, so optionally support setting that
    this[sCity] = options.parkCity;
  }

  // override Fastpass Getter to declare support for FastPass
  get FastPass() {
    return true;
  }

  /**
   * Get our current access token
   * @returns {Promise}
   */
  GetAccessToken() {
    let receivedTtl;

    return this.Cache.Wrap('accesstoken', () => {
      // Get access token
      // generate access token signature
      //  calculate current date to generate access token signature
      const today = `${Moment.utc().format('ddd, DD MMM YYYY HH:mm:ss')} GMT`;

      // create signature to get access token
      const signatureBuilder = crypto.createHmac('sha256', apiAppSecret);
      signatureBuilder.update(`${apiAppKey}\n${today}\n`);
      // generate hash from signature builder
      //  also convert trailing equal signs to unicode. because. I don't know
      const signature = signatureBuilder.digest('base64').replace(/=$/, '\u003d');

      // request new access token
      return this.HTTP({
        url: apiBaseURL,
        method: 'POST',
        headers: {
          Date: today,
        },
        body: {
          apiKey: apiAppKey,
          signature,
        },
      }).then(
        (body) => {
          // check we actually got the token back
          if (!body.Token) {
            this.Log(body.toString('ascii'));
            return Promise.reject(new Error('Missing access token from Universal API'));
          }

          const expireyDate = Moment(body.TokenExpirationString, 'YYYY-MM-DDTHH:mm:ssZ');
          const now = Moment();
          // expire this access token a minute before the API says (just to be sure)
          receivedTtl = expireyDate.diff(now, 'seconds') - 60;

          // resolve with our new access token (Wrap will cache for us)
          return Promise.resolve(body.Token);
        },
        (err) => {
          this.Log(`Error fetching Universal Access Token: ${err}`);
          return Promise.reject(new Error(err));
        }
      );
    }, receivedTtl);
  }

  /**
   * Fetch a URL from the Universal API
   */
  GetAPIUrl(requestObject) {
    return this.GetAccessToken().then((accessToken) => {
      // make sure headers exist if they weren't set already
      if (!requestObject.headers) requestObject.headers = [];
      requestObject.headers.Accept = 'application/json';
      requestObject.headers['Content-Type'] = 'application/json; charset=UTF-8';
      requestObject.headers['Accept-Language'] = 'en-US';

      // add our access token to the request
      if (accessToken) {
        requestObject.headers['X-UNIWebService-ApiKey'] = apiAppKey;
        requestObject.headers['X-UNIWebService-Token'] = accessToken;
      }

      // send network request
      return this.HTTP(requestObject);
    });
  }

  /**
   * Fetch this Universal Park's waiting times
   * @returns {Promise}
   */
  FetchWaitTimes() {
    // ride wait time data is kept in the pointsOfInterest URL
    return this.GetAPIUrl({
      url: `${apiBaseURL}pointsOfInterest`,
      data: this[sCity] ? {
        city: this[sCity],
      } : null,
    }).then((body) => {
      if (!body || !body.Rides) return Promise.reject(new Error('Universal POI data missing Rides array'));

      body.Rides.forEach((ride) => {
        // skip if this ride isn't for our current park
        // TODO - store poiData separately for both parks to access
        if (ride.VenueId === this[sParkID]) {
          // waitTimes assumed key:
          //  -1 seems to mean "closed"
          //  -2 means "delayed", which I guess is a nice way of saying "broken"
          //  -3 and -50 seems to mean planned closure

          this.UpdateRide(ride.Id, {
            name: ride.MblDisplayName,
            waitTime: ride.WaitTime,
            fastPass: ride.ExpressPassAccepted,
          });
        }
      });

      return Promise.resolve();
    });
  }

  /**
   * Fetch this Universal Park's opening times
   * @returns {Promise}
   */
  FetchOpeningTimes() {
    // pick a date 1 month from now (in middle/lowest/highest form MM/DD/YYYY, because I don't know)
    const hoursEndDate = Moment().add(12, 'months').format('MM/DD/YYYY');

    return this.GetAPIUrl({
      url: `${apiBaseURL}venues/${this[sParkID]}/hours`,
      data: {
        endDate: hoursEndDate,
        city: this[sCity] ? this[sCity] : null,
      },
    }).then((body) => {
      if (!body || !body.length) return Promise.reject(new Error('No venue hour data found from Universal API'));

      // find all published opening times for the next year and insert into our schedule
      body.forEach((day) => {
        this.Schedule.SetDate({
          // for ease, we'll just parse the Unix timestamp
          openingTime: Moment.tz(day.OpenTimeString, 'YYYY-MM-DDTHH:mm:ssZ', this.Timezone),
          closingTime: Moment.tz(day.CloseTimeString, 'YYYY-MM-DDTHH:mm:ssZ', this.Timezone),
        });
      });

      return Promise.resolve();
    });
  }
}

// export the class
module.exports = UniversalPark;
