// base park objects
const Moment = require('moment-timezone');
const cheerio = require('cheerio');
const Park = require('../park.js');

// API settings
const baseCalendarUrl = 'api/sitecore/Marquee/LoadCalendarData';

const sParkID = Symbol('Park ID');
const sCalendarID = Symbol('Calendar ID');
const sSiteHost = Symbol('Site Host');
const sBrand = Symbol('Brand');

function _cleanupRideName(rideName) {
  return rideName.replace(/ \(Ride\)/i, '').replace(/[®™]/, '').trim();
}

/**
 * Implements the Seaworld API framework.
 * @class
 * @extends Park
 */
class SeaworldBase extends Park {
  /**
   * Create new SeaworldBase Object.
   * This object should not be called directly, but rather extended for each of the individual Seaworld Parks
   * @param {Object} options
   * @param {String} options.parkID Seaworld API park ID
   * @param {String} options.siteHost Seaworld Site Host
   * @param {String} options.brand Seaworld Park Brand
   */
  constructor(options = {}) {
    // inherit from base class
    super(options);

    // check we have our park_id
    if (!options.parkID) {
      throw new Error('No parkID supplied for Seaworld park');
    }
    this[sParkID] = options.parkID;

    if (!options.calendarID) {
      throw new Error('No calendar ID supplied for SeaWorld park');
    }
    this[sCalendarID] = options.calendarID;

    if (!options.siteHost) {
      throw new Error('No Site Host supplied for SeaWorld park');
    }
    this[sSiteHost] = options.siteHost;

    if (!options.brand) {
      throw new Error('No brand supplied for SeaWorld park');
    }
    this[sBrand] = options.brand;
  }

  FetchWaitTimesPage() {
    return this.HTTP({
      url: `https://${this[sSiteHost]}/${this[sParkID]}/ride-wait-times/`,
      mock: `${this[sBrand]}RideTimes_${this[sParkID]}`,
    });
  }

  ParseWaitTimesPage(html) {
    const $ = cheerio.load(html, {
      decodeEntities: true,
    });

    const waitTimes = $('.ride-times-wrapper').map((i, elem) => {
      const $wrapper = cheerio.load(elem);
      const waitingTime = parseInt($wrapper('.ride-times-hours').text(), 10);
      return {
        name: _cleanupRideName($wrapper('.ride-times-title').text()),
        waitTime: Number.isNaN(waitingTime) ? -2 /* Down */ : waitingTime,
      };
    }).toArray();

    return waitTimes;
  }

  FetchRideNamesPage() {
    return this.HTTP({
      url: `https://${this[sSiteHost]}/${this[sParkID]}/rides/`,
      mock: `${this[sBrand]}RideNames_${this[sParkID]}`,
    });
  }

  ParseRideNames(resp) {
    const $ = cheerio.load(resp, {
      decodeEntities: true,
    });
    const rides = $('h2.base-listing-child__title a').map((i, elem) => {
      const tidyName = _cleanupRideName(elem.firstChild.nodeValue);
      const hypenIndex = tidyName.indexOf('-');
      const rideId = (hypenIndex >= 0 ? tidyName.substring(0, hypenIndex) : tidyName).toLowerCase().replace(/[^a-z]/g, '');
      return {
        id: rideId,
        name: tidyName,
      };
    }).toArray();

    return Promise.resolve(rides);
  }

  GetRideNames() {
    return this.Cache.Wrap(`ridenames_${this[sParkID]}`, () => this.FetchRideNamesPage().then(this.ParseRideNames), 60 * 24);
  }

  FetchWaitTimes() {
    return this.GetRideNames().then(rideNames => this.FetchWaitTimesPage().then(this.ParseWaitTimesPage).then((waitTimes) => {
      rideNames.forEach((ride) => {
        const waitTimeData = waitTimes.find(x => x.name === ride.name);

        this.UpdateRide(ride.id, {
          name: ride.name,
          waitTime: waitTimeData ? waitTimeData.waitTime : -1,
        });
      });

      return Promise.resolve();
    }));
  }

  FetchCalendarMonth(yyyymm) {
    const startDate = Moment(`${yyyymm}01`, 'YYYYMMDD');
    const endDate = startDate.clone().endOf('month');

    return this.HTTP({
      url: `https://${this[sSiteHost]}/${baseCalendarUrl}`,
      data: {
        itemId: this[sCalendarID],
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD'),
      },
      headers: {
        referer: `https://${this[sSiteHost]}/${this[sParkID]}/park-info/theme-park-hours/`,
      },
      forceJSON: true,
      mock: `${this[sBrand]}Calendar_${this[sParkID]}_${yyyymm}`,
    });
  }

  ParseCalendarData(data) {
    data.forEach((date) => {
      const timeRegex = /([0-9]+:[0-9]{2}[a|p]m)-([0-9]+:[0-9]{2}[a|p]m)/;
      const match = timeRegex.exec(date.title);

      if (match !== null) {
        const open = Moment.tz(match[1], 'HH:mma', this.Timezone);
        const close = Moment.tz(match[2], 'HH:mma', this.Timezone);
        if (close.isBefore(open)) {
          close.add(1, 'day');
        }

        this.Schedule.SetDate({
          date: Moment(date.start, 'YYYY-MM-DDTHH:mm'),
          openingTime: open,
          closingTime: close,
          specialHours: date.type !== 'park-hours',
          type: date.isOpen ? 'Operating' : 'Closed',
        });
      }
    });
  }

  FetchOpeningTimes() {
    const now = Moment.tz(this.Timezone);
    const months = [
      this.FetchCalendarMonth(now.format('YYYYMM')),
      this.FetchCalendarMonth(now.add(1, 'month').format('YYYYMM')),
      this.FetchCalendarMonth(now.add(1, 'month').format('YYYYMM')),
    ];

    return Promise.all(months).then((monthData) => {
      monthData.map(this.ParseCalendarData.bind(this));
      return Promise.resolve();
    });
  }
}

// export just the Base Seaworld Park class
module.exports = SeaworldBase;
