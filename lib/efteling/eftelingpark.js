const Moment = require('moment-timezone');
const Park = require('../park');
const Location = require('../location.js');

const sApiVersion = Symbol('API Version');
const sApiKey = Symbol('API Key');
const sSearchURL = Symbol('Search URL Base');
const sWaitTimesURL = Symbol('Wait Times URL');
const sAppVersion = Symbol('APP Version');

/**
 * Implements the Efteling API framework.
 * @class
 * @extends Park
 */
class Efteling extends Park {
  /**
   * Create new Efteling Object.
   * @param {Object} [options]
   * @param {String} [options.api_version] Version of the API to reference in request headers
   * @param {String} [options.api_key] API Key
   * @param {String} [options.digest_key] Key used to generate URL header digest
   * @param {String} [options.crypto_key] Key to decrypt wait times
   * @param {String} [options.crypto_cipher] Cipher to decrypt wait times
   * @param {Buffer} [options.crypto_iv] IV to decrypt wait times
   * @param {String} [options.search_url] URL used for fetching POI data
   */
  constructor(options = {}) {
    options.name = options.name || 'Efteling';

    options.timezone = options.timezone || 'Europe/Amsterdam';

    // set park's location as it's entrance
    options.latitude = options.latitude || 51.64990915659694;
    options.longitude = options.longitude || 5.043561458587647;

    options.useragent = options.useragent || 'okhttp/4.4.0';

    // inherit from base class
    super(options);

    // api settings
    this[sApiVersion] = options.apiVersion || '7';
    this[sApiKey] = options.apiKey || 'u5WHTRvELJ1NOui0DBwui2NC4XhD4eOWap9o78W3';
    this[sAppVersion] = options.appVersion || 'v3.5.0';

    // URL settings
    this[sSearchURL] = options.searchUrl || 'http://prd-search-acs.efteling.com/2013-01-01/';
    this[sWaitTimesURL] = options.waitTimesUrl || 'https://api.efteling.com/app/wis/';
  }

  /**
   * Get POI data for this park (from the cache or fetch fresh data if none is cached)
   * @returns {Promise}
   */
  GetPOIData() {
    return this.Cache.Wrap('poidata', this.FetchPOIData.bind(this), 60 * 60 * 24);
  }

  /**
   * Fetch POI data for the park.
   * Don't call this function directly unless you know what you're doing. Use GetPOIData instead to use cached data when possible.
   * @returns {Promise} Object of Ride IDs => Object containing name and location (GeoLocation object, if location is available for this ride)
   */
  FetchPOIData() {
    return this.MakeRequest({
      url: `${this[sSearchURL]}search`,
      data: {
        size: 1000,
        'q.parser': 'structured',
        q: "(phrase field=language 'en')",
      },
      headers: {
        'X-App-Version': this[sAppVersion],
      },
    }).then((result) => {
      if (!result || !result.hits || !result.hits.hit) {
        throw new Error(`No results returned for POI data for Efteling Park: ${result}`);
      }

      const poiData = {};

      result.hits.hit.forEach((hit) => {
        if (hit.fields) {
          // ignore non-attractions
          if (hit.fields.category === 'attraction') {
            poiData[hit.fields.id] = {
              name: hit.fields.name,
            };

            // try to parse lat/long
            //  edge-case: some rides have dud "0.0,0.0" location, ignore these
            if (hit.fields.latlon && hit.fields.latlon !== '0.0,0.0') {
              const match = /([0-9.]+),([0-9.]+)/.exec(hit.fields.latlon);
              if (match) {
                poiData[hit.fields.id].location = new Location({
                  name: `Efteling Ride - ${hit.fields.name}`,
                  latitude: match[1],
                  longitude: match[2],
                  timezone: this.Timezone,
                });
              }
            }
          }
        }
      });

      return poiData;
    });
  }

  /**
   * Fetch park wait times
   * @returns {Promise}
   */
  FetchWaitTimes() {
    // first, get POI data
    return this.GetPOIData().then(poiData => this.FetchWaitTimesData().then((waitData) => {
      // parse and inject into park data
      if (!waitData.AttractionInfo) return Promise.reject(new Error('No AttractionInfo found for Efteling Park response'));

      waitData.AttractionInfo.forEach((item) => {
        // check we have POI data and item is an attraction
        if (item.Type === 'Attraction' && poiData[item.Id] !== undefined) {
          let rideWaitTime = -1;
          // update ride with wait time data
          if (item.State === 'storing') {
            // Ride down because of an interruption
            rideWaitTime = -2;
          } else if (item.State === 'inonderhoud') {
            // Ride down because of maintenance/refurbishment
            rideWaitTime = -3;
          } else if (item.State === 'open') {
            // Ride operating
            rideWaitTime = parseInt(item.WaitingTime, 10);
          }

          // add ride locations (if we have it)
          let rideMeta;
          if (poiData[item.Id].location) {
            rideMeta = {};
            rideMeta.location = poiData[item.Id].location.LocationString;
            rideMeta.longitude = poiData[item.Id].location.LongitudeRaw || undefined;
            rideMeta.latitude = poiData[item.Id].location.LatitudeRaw || undefined;
          }

          this.UpdateRide(item.Id, {
            name: poiData[item.Id].name,
            waitTime: rideWaitTime,
            meta: rideMeta,
          });
        }
      });

      return Promise.resolve();
    }));
  }

  /**
   * Fetch the raw wait times data for Efteling Park
   */
  FetchWaitTimesData() {
    return this.MakeRequest({
      url: this[sWaitTimesURL],
      data: {
        language: 'en',
      },
    });
  }

  /**
   * Make an API request against the Efteling API
   * Injects required headers and passes request through to standard HTTP method
   * See HTTP for full documentation on how to use
   * @param {Object} requestOptions
   * @return {Promise}
   */
  MakeRequest(requestOptions) {
    if (!requestOptions.url) {
      return Promise.error('No URL supplied');
    }

    // add our required headers
    if (!requestOptions.headers) requestOptions.headers = {};
    requestOptions.headers['x-api-version'] = this[sApiVersion];
    requestOptions.headers['x-api-key'] = this[sApiKey];
    requestOptions.headers['x-api-platform'] = 'Android';

    return this.HTTP(requestOptions);
  }

  /**
   * Request park opening times.
   * @returns {Promise}
   */
  FetchOpeningTimes() {
    // calculate how many (and which) months we want to check
    const endMonth = Moment().tz(this.Timezone).add(this.ScheduleDays, 'days');
    const datePointer = Moment().tz(this.Timezone);
    const months = [];

    this.Log(`Fetching opening hours between ${datePointer.format()} and ${endMonth.format()}`);

    // slide along between start and end until we go past endMonth to get an array of required month/year combos
    while (datePointer.isSameOrBefore(endMonth, 'month')) {
      months.push({
        month: datePointer.format('M'),
        year: datePointer.format('YYYY'),
      });
      datePointer.add(1, 'months');
    }

    // loop through each month, calling FetchOpeningTimesByMonth
    return Promise.all(months.map(month => this.FetchOpeningTimesByMonth(month.month, month.year))).then((results) => {
      // inject results into calendar
      results.forEach((hours) => {
        hours.forEach((times) => {
          this.Schedule.SetDate({
            date: times.open,
            openingTime: times.open,
            closingTime: times.close,
          });
        });
      });
      return results;
    });
  }

  /**
   * Fetch park opening times for a specific month and add to park's opening times
   * @param {String} month
   * @param {String} [year]
   * @returns {Promise} Array of Objects containing "open" and "close" Moment objects
   */
  FetchOpeningTimesByMonth(month, year) {
    // default to current year if none supplied
    let currentYear = year;
    if (!currentYear) {
      currentYear = Moment.tz(this.Timezone).format('YYYY');
    }

    return this.HTTP({
      url: `https://www.efteling.com/service/cached/getpoiinfo/en/${currentYear}/${month}`,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    }).then((data) => {
      if (!data) throw new Error(`Invalid data returned for park opening hours for ${month}/${currentYear}`);
      if (!data.OpeningHours) throw new Error(`No park opening hours data returned for ${month}/${currentYear}`);

      // build array of Moment objects for each open and close time
      const result = [];

      data.OpeningHours.forEach((date) => {
        const open = Moment.tz(`${date.Date}${date.Open}`, 'YYYY-MM-DDHH:mm', this.Timezone);
        const close = Moment.tz(`${date.Date}${date.Close}`, 'YYYY-MM-DDHH:mm', this.Timezone);
        result.push({
          open,
          close,
        });
      });

      return result;
    });
  }
}

module.exports = Efteling;
