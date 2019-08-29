// base park objects
const Moment = require('moment-timezone');
const Park = require('../park.js');

// API settings
const baseUrl = 'https://buschgardens.com/';
const baseCalendarUrl = 'https://buschgardens.com/api/sitecore/Marquee/LoadCalendarData';

const sParkID = Symbol('Park ID');
const sCalendarID = Symbol('Calendar ID');

/**
 * Implements the BuschGardens API framework.
 * @class
 * @extends Park
 */
class BuschGardensBase extends Park {
  /**
   * Create new BuschGardensBase Object.
   * This object should not be called directly, but rather extended for each of the individual Busch Gardens Parks
   * @param {Object} options
   * @param {String} options.parkID Busch Gardens API park ID
   */
  constructor(options = {}) {
    // inherit from base class
    super(options);

    // check we have our park_id
    if (!options.parkID) {
      throw new Error('No parkID supplied for Busch Gardens park');
    }
    this[sParkID] = options.parkID;

    if (!options.calendarID) {
      throw new Error('No calendar ID supplied for Busch Gardens park');
    }
    this[sCalendarID] = options.calendarID;
  }

  FetchWaitTimesPage() {
    return this.HTTP({
      url: `${baseUrl}/${this[sParkID]}/ride-wait-times/`,
      mock: `buschgardensRideTimes_${this[sParkID]}`,
    });
  }

  ParseWaitTimesPage(html) {
    const waitTimeSearchRegex = /ride-times-title">([^<]+)<\/div>.*ride-times-hours[a-z-]*">([^<]+)<\/div>/;
    const HTMLPieces = html.toString().replace(/[\r\n]/g, '').split('ride-times-wrapper');

    const waitTimes = [];

    HTMLPieces.forEach((piece) => {
      const match = waitTimeSearchRegex.exec(piece);
      if (match) {
        waitTimes.push({
          name: match[1],
          waitTime: match[2].trim(),
        });
      }
    });

    return waitTimes;
  }

  FetchRideNamesPage() {
    return this.HTTP({
      url: `${baseUrl}/${this[sParkID]}/rides/`,
      mock: `buschgardensRideNames_${this[sParkID]}`,
    });
  }

  ParseRideNames(resp) {
    const rideNameRegex = /<h2 class="base-listing-child__title">\s*<a href="[^"]+">([^<]+)<\/a>\s*<\/h2>/;
    const HTMLPieces = resp.toString().replace(/[\r\n]/g, '').split('base-listing-child js-base-filter-item');

    const rides = [];

    HTMLPieces.forEach((p) => {
      const match = rideNameRegex.exec(p);
      if (match) {
        const tidyName = match[1].replace(/ \(Ride\)/, '').trim();
        const hypenIndex = tidyName.indexOf('-');
        const rideId = (hypenIndex >= 0 ? tidyName.substring(0, hypenIndex) : tidyName).toLowerCase().replace(/[^a-z]/g, '');
        rides.push({
          id: rideId,
          name: tidyName,
        });
      }
    });

    return Promise.resolve(rides);
  }

  GetRideNames() {
    return this.Cache.Wrap(`ridenames_${this[sParkID]}`, () => this.FetchRideNamesPage().then(this.ParseRideNames), 60 * 24);
  }

  FetchWaitTimes() {
    // get ride names
    return this.GetRideNames().then(rideNames => this.FetchWaitTimesPage().then(this.ParseWaitTimesPage).then((waitTimes) => {
      rideNames.forEach((ride) => {
        const waitTimeData = waitTimes.find(x => x.name === ride.name);

        let rideWaitTime = -1;
        if (waitTimeData !== undefined) {
          const match = /([0-9]+)\s+mins/.exec(waitTimeData.waitTime);
          if (match) {
            rideWaitTime = Number(match[1]);
          } else {
            // if format doesn't match x mins, then ride is down
            rideWaitTime = -2;
          }
        }

        this.UpdateRide(ride.id, {
          name: ride.name,
          waitTime: rideWaitTime,
        });
      });

      return Promise.resolve();
    }));
  }

  FetchCalendarMonth(yyyymm) {
    const startDate = Moment(`${yyyymm}01`, 'YYYYMMDD');
    const endDate = startDate.clone().endOf('month');

    return this.HTTP({
      url: `${baseCalendarUrl}`,
      data: {
        itemId: this[sCalendarID],
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD'),
      },
      headers: {
        referer: `https://buschgardens.com/${this[sParkID]}/park-info/theme-park-hours/`,
      },
      forceJSON: true,
      mock: `buschgardensCalendar_${this[sParkID]}_${yyyymm}`,
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

// export just the Base Busch Gardens Park class
module.exports = BuschGardensBase;
