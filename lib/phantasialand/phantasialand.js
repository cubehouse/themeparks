const cheerio = require('cheerio');
const Moment = require('moment');
const Park = require('../park');
const Location = require('../location');

const sParkAPIBase = Symbol('Phantasialand API Base URL');
const sParkAccessToken = Symbol('Phantasialand Access Token');
const sLongMin = Symbol('Minimum Random Longitude');
const sLongMax = Symbol('Maximum Random Longitude');
const sLatMin = Symbol('Minimum Random Latitude');
const sLatMax = Symbol('Maximum Random Latitude');
const sCalendarURL = Symbol('Phantasialand Calendar URL');

/** Parse an hour time string into a Moment object */
function MatchTime(time, timezone) {
  const match = /\s*(\d+)(?::(\d+))?\s*([ap]m)/.exec(time);
  if (match) {
    const mTime = Moment.tz({
      hour: 0,
      minute: 0,
      seconds: 0,
    }, timezone);
    mTime.set('hour', match[3] === 'pm' ? ((Number(match[1]) % 12) + 12) : Number(match[1]));
    if (match[2] !== undefined) {
      mTime.set('minute', Number(time[2]));
    }
    return mTime;
  }
  return null;
}

/**
 * Implements the Phantasialand API framework.
 * @class
 * @extends Park
 */
class Phantasialand extends Park {
  /**
   * Create new Phantasialand Object.
   * @param {Object} [options]
   * @param {String} [options.apiBase] Optional base URL for API requests
   */
  constructor(options = {}) {
    options.name = options.name || 'Phantasialand';

    // Phantasialand Entrance coordinates
    options.latitude = options.latitude || 50.798954;
    options.longitude = options.longitude || 6.879314;

    // park's timezone
    options.timezone = 'Europe/Berlin';

    super(options);

    this[sParkAPIBase] = options.apiBase || 'https://api.phlsys.de/api/';
    this[sParkAccessToken] = options.accessToken || 'auiJJnDpbIWrqt2lJBnD8nV9pcBCIprCrCxaWettkBQWAjhDAHtDxXBbiJvCzkUf';

    this[sLongMin] = options.longitudeMin || 6.878342628;
    this[sLongMax] = options.longitudeMax || 6.877570152;
    this[sLatMin] = options.latitudeMin || 50.800659529;
    this[sLatMax] = options.latitudeMax || 50.799683077;

    this[sCalendarURL] = options.calendarURL || 'https://www.phantasialand.de/en/park/be-our-guest-information/opening-hours/';
  }

  FetchPOIData() {
    return this.HTTP({
      url: `${this[sParkAPIBase]}pois?filter[where][seasons][like]=%25SUMMER%25&compact=true&access_token=auiJJnDpbIWrqt2lJBnD8nV9pcBCIprCrCxaWettkBQWAjhDAHtDxXBbiJvCzkUf`,
      method: 'GET',
      data: {
        compact: true,
        access_token: this[sParkAccessToken],
      },
    }).then((data) => {
      const rides = {};

      data.forEach((ride) => {
        const location = (ride.entrance && ride.entrance.world) ? ride.entrance.world : undefined;
        rides[ride.id] = {
          name: ride.title.en ? ride.title.en : ride.title,
          meta: {
            area: ride.area.en ? ride.area.en : ride.area,
            longitude: location ? location.lng : null,
            latitude: location ? location.lat : null,
          },
        };
      });

      return Promise.resolve(rides);
    });
  }

  GetPOIData() {
    // cache POI data for 2 days
    return this.Cache.Wrap('POI', () => {
      return this.FetchPOIData();
    }, 60 * 60 * 48);
  }

  FetchWaitTimes() {
    return this.GetPOIData().then((poi) => {
      // generate random point within Phantasialand
      const RandomLocation = Location.RandomBetween(this[sLongMin], this[sLatMin], this[sLongMax], this[sLatMax]);

      return this.HTTP({
        url: `${this[sParkAPIBase]}signage-snapshots`,
        method: 'GET',
        data: {
          loc: `${RandomLocation.latitude},${RandomLocation.longitude}`,
          compact: true,
          access_token: this[sParkAccessToken],
        },
      }).then((rideData) => {
        rideData.forEach((ride) => {
          if (poi[ride.poiId]) {
            const ridePOI = poi[ride.poiId];
            let waitTime = -1;
            if (ride.open && ride.waitTime !== null) {
              // eslint-disable-next-line prefer-destructuring
              waitTime = ride.waitTime;
            }
            this.UpdateRide(ride.poiId, {
              name: ridePOI.name,
              meta: ridePOI.meta,
              waitTime,
            });
          }
        });

        return Promise.resolve();
      });
    });
  }

  FetchOpeningTimes() {
    return this.HTTP({
      url: this[sCalendarURL],
      mock: 'phantasialand_calendarHTML',
    }).then((html) => {
      const $ = cheerio.load(html);

      // scan legend HTML for time ranges
      const timeRanges = {};
      const legend = $('.legend-inner').first();
      legend.find('div > ul > li').each((idx, range) => {
        const rangeEl = $(range);
        const colour = rangeEl.find('span').first().attr('class');
        const times = rangeEl.text().split(':').slice(-1)[0].trim();

        if (times.toLowerCase() !== 'closed') {
          const hours = times.split('–');
          timeRanges[colour] = {
            openingHour: MatchTime(hours[0], this.Timezone),
            closingHour: MatchTime(hours[1], this.Timezone),
          };
        }
      });

      const timeKeys = Object.keys(timeRanges);

      // scan calendar HTML
      $('.month').each((idx, el) => {
        const month = $(el);
        const yearAndMonth = month.find('div.title > time').first().attr('datetime')
          .split('-')
          .map(Number);

        month.find('ul.days > li').each((dayIdx, day) => {
          const dayEl = $(day);
          const typeSpan = dayEl.find('span');
          if (typeSpan !== undefined) {
            const typeClass = typeSpan.attr('class');
            if (typeClass) {
              const type = typeClass.split(/\s+/g).find((x) => {
                return timeKeys.indexOf(x) >= 0;
              });
              if (type !== undefined) {
                const date = Number(dayEl.find('time').first().text());
                if (date) {
                  const group = timeRanges[type];

                  const OpenTime = Moment.tz({
                    year: yearAndMonth[0],
                    month: yearAndMonth[1] - 1,
                    date,
                    hour: group.openingHour.get('hour'),
                    minute: group.openingHour.get('minute'),
                  }, this.Timezone);

                  const CloseTime = OpenTime.clone().set('hour', group.closingHour.get('hour')).set('minute', group.closingHour.get('minute'));

                  this.Schedule.SetDate({
                    openingTime: OpenTime,
                    closingTime: CloseTime,
                  });
                }
              }
            }
          }
        });
      });

      return Promise.resolve();
    });
  }
}

module.exports = Phantasialand;
