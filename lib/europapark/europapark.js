// include core Park class
const Moment = require('moment-timezone');

// crypto library for generating access tokens
const crypto = require('crypto');
const Park = require('../park');

const sApiBase = Symbol('Europa Park API Base URL');
const sApiVersion = Symbol('Europa Park API Version');
const sParkSecretToken = Symbol('Europa Park Auth Token');

/**
 * Implements the Europa Park API framework.
 * @class
 * @extends Park
 */
class EuropaPark extends Park {
  /**
   * Create new EuropaPark Object.
   * @param {Object} [options]
   * @param {String} [options.apiBase] Optional base URL for API requests
   * @param {String} [options.apiVersion] API Version to make requests to (default: 'api-5.2')
   * @param {String} [options.secretToken] Secret token to use to generate the wait times API access token
   */
  constructor(options = {}) {
    options.name = options.name || 'Europa Park';

    // Europa-Park coordinates
    options.latitude = options.latitude || 48.268931;
    options.longitude = options.longitude || 7.721559;

    // Use the Android app's user-agent
    options.useragent = options.useragent || 'okhttp/3.9.1';

    // park's timezone
    options.timezone = 'Europe/Berlin';

    // inherit from base class
    super(options);

    // accept overriding the API base URL
    this[sApiBase] = options.apiBase || 'https://api.europapark.de/';
    // accept overriding API version
    this[sApiVersion] = options.apiVersion || 'api-5.9';
    // take secret token from options, or default to known token
    this[sParkSecretToken] = options.secretToken || 'ZhQCqoZp';
  }

  /**
   * Generate an access token for accessing wait times
   * @returns {String} Current Access Token
   */
  GenerateAccessToken() {
    // generate wait times access code

    // start with current park date in UTC (YYYYMMDDHH format)
    const currentParkDate = Moment.utc().format('YYYYMMDDHH');

    // sha256 hash using key
    const hmac = crypto.createHmac('sha256', this[sParkSecretToken]);
    hmac.update(currentParkDate);
    const code = hmac.digest('hex').toUpperCase();

    this.Log(`Generated Europa wait times code ${code} for date ${currentParkDate}`);

    return code;
  }

  /**
   * Fetches fresh or cached ride data from the park API
   * @returns {Promise<Object>} Object of Ride ID => Ride Name in English (or German if no English name is available)
   */
  FetchRideData() {
    return this.Cache.Wrap('poidata',
      () => this.HTTP({
        url: `${this[sApiBase]}${this[sApiVersion]}/pointsofinterest`,
        mock: 'EuropaRideData',
      }).then((rideData) => {
        // extract names from returned data
        const rideNames = {};
        rideData.forEach((poi) => {
          // types:
          //  1: ride
          //  2: food
          //  3: park entrance
          //  5: shop
          //  6: show

          // not all attractions have English names, so fallback to German if missing
          let poiName = poi.name.find(langArr => langArr.language === 'en');
          if (poiName === undefined) {
            poiName = poi.name.find(langArr => langArr.language === 'de');
          }

          rideNames[poi.code] = {
            name: (poiName !== undefined) ? poiName.value : '???',
            thrillLevel: poi.thrill,
            longitude: poi.longitude,
            latitude: poi.latitude,
            guestsPerHour: poi.theoreticalCapacity || undefined,
            rideTimeSeconds: poi.drivingTime || undefined,
            minAge: poi.ageMin || undefined,
            minHeightCM: poi.sizeMin || undefined,
            maxHeightCM: poi.sizeMax || undefined,
          };
        });

        return Promise.resolve(rideNames);
      }),
      60 * 60 * 24);
  }

  /**
   * Fetch Wait times
   */
  FetchWaitTimes() {
    // fetch ride names before getting wait times (usually this will come from the cache)
    return this.FetchRideData().then(rideData => this.HTTP({
      url: `${this[sApiBase]}${this[sApiVersion]}/waitingtimes`,
      data: {
        mock: false,
        token: this.GenerateAccessToken(),
      },
      mock: 'EuropaWaitTimes',
    }).then((waitTimes) => {
      // if empty, park is just totally closed (!)
      if (!waitTimes.length) {
        // mark each ride as inactive
        // loop through previously known-about rides
        this.Rides.forEach((ride) => {
          this.UpdateRide(ride.code, {
            name: rideData[ride.code].name || '???',
            waitTime: -1,
          });
        });

        // TODO - loop over a hard-coded list of known rides at the park

        // resolve early
        return Promise.resolve();
      }

      waitTimes.forEach((ridetime) => {
        // FYI, ridetime.type:
        //   1: rollercoaster
        //   2: water
        //   3: adventure

        // status meanings:
        //  0: Open!
        //  1: Wait time is over 90 minutes
        //  2: Closed
        //  3: Broken Down
        //  4: Bad weather
        //  5: VIP/Special Tour
        //  other: Probably just crazy long wait times

        // lowest wait time is 1 minute (according to app)
        let waittime = 0;
        // copy how the app reacts to >90 minute waits
        if (ridetime.status === 0) {
          waittime = ridetime.time > 0 ? ridetime.time : 90;
        } else if (ridetime.status === 1) {
          waittime = 91;
        } else if (ridetime.status === 2) {
          waittime = -1;
        } else if (ridetime.status === 3) {
          waittime = -2;
        }

        const rideUpdate = {
          waitTime: waittime,
          name: '???',
          meta: {},
        };

        // add our metadata to our update object
        if (rideData[ridetime.code]) {
          Object.keys(rideData[ridetime.code]).forEach((k) => {
            if (k === 'name') {
              rideUpdate.name = rideData[ridetime.code].name;
            } else {
              rideUpdate.meta[k] = rideData[ridetime.code][k];
            }
          });
        }

        this.UpdateRide(ridetime.code, rideUpdate);
      });

      return Promise.resolve();
    }));
  }

  /**
   * Fetch Europa Park opening time data
   * @returns {Promise}
   */
  FetchOpeningTimes() {
    return this.HTTP({
      url: `${this[sApiBase]}${this[sApiVersion]}/openingtimes`,
      mock: 'EuropaOpeningTimes',
    }).then((openingTimes) => {
      openingTimes.forEach((season) => {
        season.seasonTimes.forEach((sched) => {
          // EuropaPark returns opening hours in blocks of ranges
          //  set each range of dates in our schedule object
          this.Schedule.SetRange({
            startDate: Moment.tz(sched.from, 'YYYY-MM-DD', this.Timezone),
            endDate: Moment.tz(sched.until, 'YYYY-MM-DD', this.Timezone),
            openingTime: Moment.tz(sched.opening, 'HH:mm', this.Timezone),
            closingTime: Moment.tz(sched.closing, 'HH:mm', this.Timezone),
          });
        });
      });

      // TODO - the park is actually closed on various days and has announced varients to these times
      //  find out how to get these properly!

      return Promise.resolve();
    });
  }
}

// export the class
module.exports = EuropaPark;
