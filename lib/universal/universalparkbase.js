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
const sVirtualLineTimes = Symbol('Load Virtual Lines');

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

    // load available virtual lines times with wait times
    this[sVirtualLineTimes] = options.virtualLineTimes;
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

    return this.Cache.Wrap('uaaccesstoken', () => {
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
          return Promise.resolve({
            token: body.Token,
            // store our useragent alongside our token, they are linked
            useragent: this.UserAgent,
          });
        },
        (err) => {
          this.Log(`Error fetching Universal Access Token: ${err}`);
          return Promise.reject(new Error(err));
        }
      );
    }, () => Promise.resolve(receivedTtl));
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
        // set our useragent to match our accessToken's agent
        this.UserAgent = accessToken.useragent;

        requestObject.headers['X-UNIWebService-ApiKey'] = apiAppKey;
        requestObject.headers['X-UNIWebService-Token'] = accessToken.token;
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
    // Get current date for virtual lines
    const currently = Moment.tz(this.Timezone);

    const requests = [
      // ride wait time data is kept in the pointsOfInterest URL
      this.GetAPIUrl({
        url: `${apiBaseURL}pointsOfInterest`,
        data: this[sCity] ? {
          city: this[sCity],
        } : null,
      }),
    ];

    // Virtual lines require city to be set
    if (this[sVirtualLineTimes] && this[sCity]) {
      requests.push(
        this.GetAPIUrl({
          url: `${apiBaseURL}AdditionalAppts/QueuesWithAppointments`,
          data: {
            city: this[sCity],
            page: 1,
            pageSize: 'all',
            appTimeForToday: currently.format('MM/DD/YYYY'),
          },
        })
      );
    }

    return Promise.all(requests).then(([body, virtualLinesBody]) => {
      if (!body || !body.Rides) return Promise.reject(new Error('Universal POI data missing Rides array'));

      const virtualLines = {};
      if (virtualLinesBody) {
        virtualLinesBody.Results.forEach((virtualLine) => {
          virtualLines[virtualLine.QueueEntityId] = virtualLine;
        });
      }

      body.Rides.forEach((ride) => {
        // skip if this ride isn't for our current park
        // TODO - store poiData separately for both parks to access
        if (ride.VenueId === this[sParkID]) {
          let waitTime;
          switch (ride.WaitTime) {
            case -50:
              // wait time unknown
              waitTime = null;
              break;
            case -9:
              // virtual line, so no real wait
              waitTime = null;
              break;
            case -8:
              // not open yet
              waitTime = -1;
              break;
            case -7:
              // "ride now"
              waitTime = 0;
              break;
            case -6:
              // "closed inside of operating hours", not sure what that means, but it's closed
              waitTime = -1;
              break;
            case -5:
              // at capacity
              waitTime = -1;
              break;
            case -4:
              // bad weather
              waitTime = -2;
              break;
            case -3:
              // internally this is called "CLOSED_LONG_TERM", but I've seen rides do this regularly in the day
              //  so I think this just means "it's really broken", and not "refurbishment"
              waitTime = -2;
              break;
            default:
              waitTime = ride.WaitTime;
          }

          const metadata = {
            latitude: ride.Latitude,
            longitude: ride.Longitude,
            virtualLine: ride.VirtualLine || false,
            singleRider: ride.HasSingleRiderLine || false,
          };

          if (this[sVirtualLineTimes] && metadata.virtualLine) {
            metadata.virtualLineAvailableTimes = [];

            if (virtualLines[ride.Id]) {
              virtualLines[ride.Id].AppointmentTimes.forEach((appointment) => {
                metadata.virtualLineAvailableTimes.push({
                  start: appointment.StartTime,
                  end: appointment.EndTime,
                });
              });
            }
          }

          this.UpdateRide(ride.Id, {
            name: ride.MblDisplayName,
            waitTime,
            fastPass: ride.ExpressPassAccepted,
            meta: metadata,
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
