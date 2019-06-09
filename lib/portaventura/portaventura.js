const Moment = require('moment');

// include core Park class
const Park = require('../park');

const Cache = require('../cache');

const sApiBase = Symbol('PortAventura API Base URL');
const sParkTitle = Symbol('PortAventura Park Title (for URLs)');
const sParkID = Symbol('PortAventura Park ID');

/**
 * Implements the PortAventura API framework and theme park.
 * @class
 * @extends Park
 */
class PortAventura extends Park {
  /**
   * Create new PortAventura Object.
   * @param {Object} [options]
   * @param {String} [options.apiBase] Optional base URL for API requests
   * @param {String} [options.parkTitle] Park Title For URLs
   * @param {String} [options.parkID] Park ID to use
   */
  constructor(options = {}) {
    options.name = options.name || 'PortAventura';

    // Europa-Park coordinates
    options.latitude = options.latitude || 41.086456;
    options.longitude = options.longitude || 1.153650;

    // park's timezone
    options.timezone = 'Europe/Madrid';

    // inherit from base class
    super(options);

    // accept overriding the API base URL
    this[sApiBase] = options.apiBase || 'https://app.portaventuraworld.com/';
    // park ID to use
    this[sParkTitle] = options.parkTitle || 'portaventura';
    this[sParkID] = options.parkID || '2';
  }

  FetchWaitTimes() {
    return this.HTTP({
      url: `${this[sApiBase]}ws/filters/${this[sParkTitle]}/atraccion/en`,
    }).then((rides) => {
      rides.forEach((ride) => {
        // parse wait time
        const parsedTime = /([-\d]+)(?::(\d+))?/.exec(ride.tiempo_espera);
        let waitTime = 0;
        if (parsedTime[1] !== '-1' && parsedTime[2] !== undefined) {
          waitTime = (Number(parsedTime[1]) * 60) + Number(parsedTime[2]);
        }

        // update ride object
        this.UpdateRide(ride.id.toString(), {
          name: ride.titulo,
          waitTime,
          meta: {
            longitude: Number(ride.longitud),
            latitude: Number(ride.latitud),
            area: ride.text_zona,
          },
        });
      });

      return Promise.resolve();
    });
  }

  FetchOpeningTimes() {
    const now = this.Now();
    const endMonth = now.clone().add(3, 'months');

    const Promises = [];

    while (now.isBefore(endMonth)) {
      Promises.push(this.FetchMonthOpeningTimes(now.year(), now.month()));
      now.add(1, 'month');
    }

    return Promise.all(Promises);
  }

  FetchMonthOpeningTimes(year, month) {
    const MonthStart = Moment({
      years: year,
      months: month,
      date: 1,
    });
    const MonthEnd = MonthStart.clone().endOf('month');

    // build array of Promises of each day for this month
    const Days = [];
    for (let m = MonthStart.clone(); m.isSameOrBefore(MonthEnd); m.add(1, 'days')) {
      Days.push({
        year,
        month,
        date: m.date(),
      });
    }

    // fetch each date in order using reduce trick
    return Days.reduce((p, n) => {
      return p.then(() => {
        return this.FetchOpeningTimesDay(n.year, n.month, n.date);
      });
    }, Promise.resolve());
  }

  FetchOpeningTimesDay(year, month, date) {
    // cache network response globally (it is used for Ferrari Land too)
    return Cache.WrapGlobal(`portventurapark_calendar_${year}_${month}_${date}`, () => {
      return this.HTTP({
        url: `${this[sApiBase]}ws/getCalendar/${date.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}/en`,
        forceJSON: true,
      });
    }, 60 * 60 * 24 * 31).then((data) => {
      if (data[this[sParkID]]) {
        // parse hour and minute out of data[this[sParkID]].horario
        const match = /(\d{2}):(\d{2}) - (\d{2}):(\d{2})/.exec(data[this[sParkID]].horario);

        if (match) {
          const day = Moment.tz({
            year,
            month,
            date,
          }, this.Timezone);

          this.Schedule.SetDate({
            day,
            openingTime: day.clone().hours(parseInt(match[1], 10)).minutes(parseInt(match[2], 10)).seconds(0),
            closingTime: day.clone().hours(parseInt(match[3], 10)).minutes(parseInt(match[4], 10)).seconds(0),
            type: data[this[sParkID]].estado === 'Open' ? 'Operating' : 'Closed',
          });
        }
      }
      return Promise.resolve();
    });
  }
}

// export the class
module.exports = PortAventura;
