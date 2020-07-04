const randomUseragent = require('random-useragent');

const Moment = require('moment-timezone');

const Park = require('../park');
const Cache = require('../cache');

const sApiKey = Symbol('API Key');
const sApiAuth = Symbol('API Auth String');
const sApiOS = Symbol('API Access OS');
const sApiVersion = Symbol('API Version');
const sApiBase = Symbol('API Base URL');
const sWebUserAgent = Symbol('API User Agent');
const sParkID = Symbol('Park ID');
const sDeviceID = Symbol('Device ID');
const sFallbackEnglishNames = Symbol('Fallback English Ride Data');

/**
 * Implements the Tokyo Disneyland API framework.
 * @class
 * @extends Park
 */
class DisneyTokyoPark extends Park {
  /**
   * Create new DisneyTokyoPark Object.
   * This object should not be called directly, but rather extended for each of the individual Tokyo Disneyland parks
   * @param {Object} options
   * @param {String} options.parkId Tokyo Disneyland API park ID
   */
  constructor(options = {}) {
    options.name = options.name || 'Tokyo Disneyland Park';
    options.timezone = options.timezone || 'Asia/Tokyo';

    const APIVersion = options.apiVersion || '1.1.7';

    options.useragent = options.useragent || `TokyoDisneyResortApp/${APIVersion} Android/9`;

    // inherit from base class
    super(options);

    this[sApiKey] = options.apiKey || '818982cd6a62e7927700a4fbabcd4534a4657a422711a83c725433839b172371';
    this[sApiAuth] = options.apiAuth || 'MmYyZDYzehoVwD52FWYyDvo22aGvetu6uaGGKdN6FILO9lp2XS17DF//BA+Gake8oJ0GKlGnJDWu/boVa32d7PfCeTqCJA==';
    this[sApiOS] = options.apiOS || 'Android 9';
    this[sApiVersion] = APIVersion;
    this[sApiBase] = options.apiBase || 'https://api-portal.tokyodisneyresort.jp';

    if (options.parkId === undefined) throw new Error('No Park ID passed to DisneyTokyoPark object constructor');
    this[sParkID] = options.parkId;

    this[sWebUserAgent] = randomUseragent.getRandom(ua => ua.osName === 'Android');

    if (!options.fallbackEnglishNames) {
      throw new Error('Must supply fallbackEnglishNames for TDR park');
    }
    this[sFallbackEnglishNames] = options.fallbackEnglishNames;

    // make sure we update the useragent once we have retrieved the app version from cache
    this.useragentSetup = false;
  }

  /* eslint-disable class-methods-use-this */
  // override Fastpass Getter to declare support for Fastpass
  get FastPass() {
    return true;
  }
  /* eslint-enable class-methods-use-this */

  get GetAPIHeaders() {
    const headers = {
      'x-api-key': this[sApiKey],
      'X-PORTAL-LANGUAGE': 'en',
      'X-PORTAL-OS-VERSION': this[sApiOS],
      'X-PORTAL-APP-VERSION': this[sApiVersion],
      'X-PORTAL-AUTH': this[sApiAuth],
      'X-PORTAL-DEVICE-NAME': 'OnePlus5',
      connection: 'keep-alive',
      'Accept-Encoding': 'gzip',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (this[sDeviceID]) {
      headers['X-PORTAL-DEVICE-ID'] = this[sDeviceID];
    }

    return headers;
  }

  /**
   * Refresh/Fetch new Wait Times for this Tokyo Disney Resort park
   * @returns {Promise}
   */
  FetchLatestVersion() {
    return this.HTTP({
      url: 'https://play.google.com/store/apps/details',
      data: {
        id: 'jp.tokyodisneyresort.portalapp',
      },
    }).then((htmlData) => {
      const regexVersionNumber = /Current Version.*(\d+\.\d+\.\d+)<\/span>/;
      const match = regexVersionNumber.exec(htmlData);
      if (match) {
        // update API version
        return Promise.resolve(match[1]);
      }

      return Promise.resolve(this[sApiVersion]);
    });
  }

  CheckLatest() {
    return Cache.WrapGlobal('tdrVersion', this.FetchLatestVersion.bind(this), 60 * 60 * 3).then((deviceID) => {
      // update our api version and user agent once fetched
      if (this[sApiVersion] !== deviceID || !this.useragentSetup) {
        this.useragentSetup = true;

        // remember this api version
        this[sApiVersion] = deviceID;

        // update user agent too
        this.UserAgent = `TokyoDisneyResortApp/${this[sApiVersion]} Android/9`;
      }

      return Promise.resolve(deviceID);
    });
  }

  FetchDeviceID() {
    if (this[sDeviceID]) return Promise.resolve(this[sDeviceID]);

    return this.CheckLatest().then(() => Cache.WrapGlobal('tdrDeviceID', () => this.HTTP({
      url: `${this[sApiBase]}/rest/v1/devices`,
      method: 'POST',
      headers: this.GetAPIHeaders,
    }).then((data) => {
      if (data && data.deviceId) {
        this.Log(`Fetched device ID for TDR: ${data.deviceId}`);

        this[sDeviceID] = data.deviceId;

        return Promise.resolve(data.deviceId);
      }

      return Promise.reject(new Error(`Unable to fetch device ID: ${data}`));
    }), 60 * 60 * 24 * 90).then((deviceID) => {
      this[sDeviceID] = deviceID;
      return Promise.resolve(deviceID);
    }));
  }

  FetchWaitTimes() {
    // first get our ride names etc.
    return this.FetchRideData().then(rides => this.FetchWaitTimesJSON().then((data) => {
      data.attractions.forEach((ride) => {
        // skip any rides we don't recognise
        if (!rides[ride.facilityCode]) return;
        // skip rides with no wait time service
        if (ride.standbyTimeDisplayType === 'FIXED') return;
        // skip anything not type 1 or 2 (rides and shows)
        if (rides[ride.facilityCode].type >= 3) return;

        const rideData = {
          // ride name
          name: rides[ride.facilityCode].name,
          meta: {
            facilityCode: rides[ride.facilityCode].facilityCode,
          },
        };

        rideData.FastPass = rides[ride.facilityCode].fastpass;
        if (rides[ride.facilityCode].fastpass) {
          if (ride.fastPassStatus === 'TICKETING') {
            rideData.meta.fastPassStartTime = `${ride.fastPassStartAt}:00`;
            rideData.meta.fastPassEndTime = `${ride.fastPassEndAt}:00`;
          }
          rideData.meta.fastPassStatus = ride.fastPassStatus;
        }

        // For older API versions, operating status was a top-level field.
        // In newer (1.0.16+) versions, it's in an "operatings" array, which
        // only seems to have a single element for now. We'll handle either for
        // backwards compatibility.
        let status = ride.operatingStatus;
        if (!status && ride.operatings && ride.operatings.length) {
          if (ride.operatings.length > 1) {
            // While there's a startAt/endAt timestamp pair in the operatings
            // message, the times appear to be inconsistent with actual operating
            // hours, and no evidence that multiple are ever sent, so we'll
            // prefer the first one.
            this.Log(`Found multiple operating messages for ${rides[ride.facilityCode].name}. Using the first one.`);
          }
          status = ride.operatings[0].operatingStatus;
        }

        if (status === 'CLOSE_NOTICE') {
          // ride is temporarily closed
          rideData.waitTime = -2;
        } else if (status === 'CANCEL') {
          // ride is closed for the day
          rideData.waitTime = -1;
        } else if (status === 'OPEN') {
          rideData.waitTime = (ride.standbyTime !== undefined && ride.standbyTime >= 0) ? ride.standbyTime : 0;
        } else {
          rideData.waitTime = -1;
        }

        this.UpdateRide(ride.facilityCode, rideData);
      });

      return Promise.resolve();
    }));
  }

  FetchWaitTimesJSON() {
    return this.FetchDeviceID()
      .then(() => this.HTTP({
        url: `${this[sApiBase]}/rest/v2/facilities/conditions`,
        method: 'GET',
        headers: this.GetAPIHeaders,
      }));
  }

  FetchRideData() {
    return this.FetchDeviceID()
      .then(() => this.Cache.Wrap('ridedata', () => this.GetEnglishNames()
        .then(englishNames => this.HTTP({
          url: `${this[sApiBase]}/rest/v2/facilities`,
          method: 'GET',
          headers: this.GetAPIHeaders,
        }).then((body) => {
          if (!body) {
            return Promise.reject(new Error('Failed to find entries in ride data response'));
          }

          const rideData = {};

          body.attractions.forEach((attr) => {
            // skip attractions from the other park
            if (attr.parkType.toLowerCase() !== this[sParkID]) return;

            const englishData = englishNames[Number(attr.facilityCode)];

            rideData[attr.facilityCode] = {
              name: englishData && englishData.name !== undefined ? englishData.name : attr.nameKana,
              fastpass: !!attr.fastpass,
              type: attr.attractionType !== undefined ? attr.attractionType.id : 1,
              facilityCode: Number(attr.facilityCode),
            };
          });

          return Promise.resolve(rideData);
        })), 86400));
  }

  GetEnglishNames() {
    return this.Cache.Wrap('ridenames', () => this.HTTP({
      url: `https://www.tokyodisneyresort.jp/en/${this[sParkID]}/attraction.html`,
      headers: {
        Referer: `https://www.tokyodisneyresort.jp/en/${this[sParkID]}/attraction.html`,
        connection: 'keep-alive',
        'User-Agent': this[sWebUserAgent],
      },
      retryDelay: 1000 * 10,
    }).then((body) => {
      if (!body) {
        this.Log('Failed to find entries in English ride names data response, using fallback data');
        return Promise.resolve(this[sFallbackEnglishNames]);
      }

      if (body.indexOf('temporarily unavailable') >= 0) {
        return Promise.resolve(this[sFallbackEnglishNames]);
      }

      const regexGetRideNames = /e">([^<]+)<\/p>[\s\n]*<a href="\/en\/td[sl]\/attraction\/detail\/([0-9]+)\/">[\s\n]*<div class="headingArea">[\s\n]*<div class="headingAreaInner">[\s\n]*<h3 class="heading3">([^<]+)</g;

      let match;
      const rideData = {};
      // eslint-disable-next-line no-cond-assign
      while (match = regexGetRideNames.exec(body)) {
        rideData[Number(match[2])] = {
          name: match[3],
          area: match[1],
        };
      }

      // add area name to any duplicate names
      Object.keys(rideData).forEach((id) => {
        const matches = [];

        Object.keys(rideData).forEach((compId) => {
          if (rideData[id].name === rideData[compId].name) {
            matches.push(compId);
          }
        });

        if (matches.length > 1) {
          matches.forEach((nameMatch) => {
            rideData[nameMatch].name = `${rideData[nameMatch].area} ${rideData[nameMatch].name}`;
          });
        }
      });

      /* eslint-disable prefer-destructuring */
      // missing facility 245 from scrape?
      if (rideData[244] && !rideData[245]) {
        rideData[245] = rideData[244];
      }
      /* eslint-enable prefer-destructuring */

      if (Object.keys(rideData).length > 0) {
        this[sFallbackEnglishNames] = rideData;
      } else {
        // no data actually found? use fallback data
        return Promise.resolve(this[sFallbackEnglishNames]);
      }

      return Promise.resolve(rideData);
    }), 86400);
  }

  FetchCalendarJSON() {
    const today = Moment().tz(this.Timezone).format('YYYY-MM-DD');

    return this.FetchDeviceID()
      .then(() => this.HTTP({
        url: `${this[sApiBase]}/rest/v1/parks/calendars?since=${today}`,
        method: 'GET',
        headers: this.GetAPIHeaders,
      }));
  }

  FetchOpeningTimes() {
    return this.FetchCalendarJSON().then((data) => {
      data.forEach((day) => {
        // skip times for the wrong park
        if (day.parkType.toLowerCase() !== this[sParkID]) return;

        this.Schedule.SetDate({
          date: Moment.tz(day.date, 'YYYY-MM-DD', this.Timezone),
          openingTime: Moment.tz(`${day.date} ${day.openTime}`, 'YYYY-MM-DD HH:mm', this.Timezone),
          closingTime: Moment.tz(`${day.date} ${day.closeTime}`, 'YYYY-MM-DD HH:mm', this.Timezone),
          type: day.closedDay ? 'Closed' : 'Operating',
        });
      });
    });
  }
}

module.exports = DisneyTokyoPark;
