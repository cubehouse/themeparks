// include core Park class
const cheerio = require('cheerio');
const Moment = require('moment-timezone');
const Park = require('../park');

const Location = require('../location');

const sAPIBase = Symbol('API Base URL');
const sAPILanguage = Symbol('API Language');
const sParkLocationMin = Symbol('Park Location Min');
const sParkLocationMax = Symbol('Park Location Max');
const sParkScheduleURL = Symbol('Schedule URL');

function UnflattenObject(obj, target) {
  if (obj.value === '') target[obj.name] = null;
  if (obj.children && obj.children.length) {
    target[obj.name] = {};
    obj.children.forEach((child) => {
      UnflattenObject(child, target[obj.name]);
    });
  } else {
    target[obj.name] = obj.value;
  }
}

function ParseRideList(body) {
  if (!body || !body.ResponseOfUSS || !body.ResponseOfUSS.Result || !body.ResponseOfUSS.Result.USSZoneList || !body.ResponseOfUSS.Result.USSZoneList.USSZone) {
    if (body.attributes && body.children && body.children[0]) {
      const rides = [];
      body.children.forEach((root) => {
        if (root.name === 'Result') {
          root.children.forEach((child) => {
            if (child.name === 'USSZoneList') {
              child.children.forEach((zoneParent) => {
                if (zoneParent.name === 'USSZone') {
                  zoneParent.children.forEach((zone) => {
                    if (zone.name === 'Content') {
                      zone.children.forEach((rideBlob) => {
                        const ride = {};
                        rideBlob.children.forEach((x) => {
                          UnflattenObject(x, ride);
                        });
                        rides.push(ride);
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
      return rides;
    }
    return [];
  }

  // "normal" response
  const rides = [];
  body.ResponseOfUSS.Result.USSZoneList.USSZone.forEach((zone) => {
    zone.Content.USSContent.forEach((ride) => {
      rides.push(ride);
    });
  });
  return rides;
}

/**
 * Implements the Universal Singapore API.
 * @class
 * @extends Park
 */
class UniversalStudiosSingapore extends Park {
  /**
   * Create new UniversalStudiosSingapore Object.
   * @param {Object} options
   * @param {String} [options.api_base] API URL base for accessing API
   * @param {String} [options.api_langauge] Language ID for API results (default: 1)
   */
  constructor(options = {}) {
    options.name = options.name || 'Universal Studios Singapore';

    // set park's location as it's entrance
    options.latitude = options.latitude || 1.254251;
    options.longitude = options.longitude || 103.823797;

    options.timezone = 'Asia/Singapore';

    // inherit from base class
    super(options);

    this[sAPIBase] = options.apiBase || 'http://cma.rwsentosa.com/Service.svc/GetUSSContent';
    this[sAPILanguage] = options.apiLangauge || 1;
    this[sParkScheduleURL] = options.scheduleUrl || 'https://www.rwsentosa.com/en/attractions/universal-studios-singapore/plan-your-visit';

    // Geofence corners (to generate random location for API requests)
    this[sParkLocationMin] = new Location({
      latitude: 1.2547872658731591,
      longitude: 103.8217341899872,
      timezone: this.Timezone,
    });
    this[sParkLocationMax] = new Location({
      latitude: 1.2533177673892697,
      longitude: 103.82408380508424,
      timezone: this.Timezone,
    });
  }

  /**
   * Fetch Universal Singapore's waiting times
   * @returns {Promise}
   */
  FetchWaitTimes() {
    // generate random geo location to fetch with
    const randomGeoLocation = Location.RandomBetween(this[sParkLocationMin], this[sParkLocationMax]);

    this.Log('Running Universal Studios Singapore');
    return this.HTTP({
      url: this[sAPIBase],
      body: {
        languageID: this[sAPILanguage],
        filter: 'Ride',
        Latitude: randomGeoLocation.LatitudeRaw,
        Longitude: randomGeoLocation.LongitudeRaw,
      },
      forceJSON: true,
    }).then((body) => {
      // figure out what response type we got
      const rides = ParseRideList(body);

      // loop through each ride
      rides.forEach((ride) => {
        this.UpdateRide(ride.USSContentID, {
          name: ride.Name,
          waitTime: (ride.Availability && ride.Availability === 'True') ? parseInt(ride.QueueTime, 10) || -1 : -1,
        });
      });

      return Promise.resolve();
    });
  }

  FetchOpeningTimesHTML() {
    return this.HTTP({
      url: this[sParkScheduleURL],
      mock: 'universalSingaporeSchedule',
    });
  }

  ParseOpeningHoursHTML(HTML) {
    const $ = cheerio.load(HTML);

    const results = [];

    // extract months from calendar header
    const months = $('.date-switch > span').map((idx, el) => $(el).text()).get().map(x => x.split(' '));

    // for each month, extract times for each date
    const regexDate = /<div>(\d+)<div class="events">(?:<strong>[^<]+<\/strong><br>)?([^<]+)</;
    $('.calendar-table').each((month, monthEl) => {
      $('td', monthEl).each((idx, el) => {
        const dateMatch = regexDate.exec($(el).html());
        if (dateMatch) {
          const date = dateMatch[1];
          const times = dateMatch[2].split(' - ').map((time) => {
            const timeOfDay = time.substring(time.length - 2);
            const justTime = time.substring(0, time.length - 2);
            if (justTime.indexOf('.') >= 0) {
              return `${justTime.split('.').map(x => x.padStart(2, '0')).join(':')}${timeOfDay}`;
            }

            return `${justTime.padStart(2, '0')}:00${timeOfDay}`;
          });

          results.push({
            date,
            month: months[month][0],
            year: months[month][1],
            openingTime: times[0],
            closingTime: times[1],
          });
        }
      });
    });

    return Promise.resolve(results);
  }

  FetchOpeningTimes() {
    // Get HTML page of park
    return this.FetchOpeningTimesHTML().then(this.ParseOpeningHoursHTML.bind(this)).then((results) => { // parse results
      results.forEach((date) => {
        const openingTime = Moment.tz(`${date.date} ${date.month} ${date.year} ${date.openingTime}`, 'DD MMMM YYYY HH:mmA', this.Timezone);
        const closingTime = Moment.tz(`${date.date} ${date.month} ${date.year} ${date.closingTime}`, 'DD MMMM YYYY HH:mmA', this.Timezone);

        // record results
        this.Schedule.SetDate({
          openingTime,
          closingTime,
        });
      });

      return Promise.resolve();
    });
  }
}

// export the class
module.exports = UniversalStudiosSingapore;
