const Moment = require('moment');

// include core Park class
const Park = require('../park');

const Cache = require('../cache');

const sApiBase = Symbol('PortAventura API Base URL');
const sParkTitle = Symbol('PortAventura Park Title (for URLs)');
const sParkID = Symbol('PortAventura Park ID');
const sParkCalendarURL = Symbol('PortAventura Park Calendar URL');

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
    this[sParkCalendarURL] = options.parkCalendarURL || 'https://www.portaventuraworld.com/page-data/en/dates-times/page-data.json';
  }

  FetchWaitTimes() {
    return this.HTTP({
      url: `${this[sApiBase]}ws/filters/${this[sParkTitle]}/atraccion/en`,
    }).then((rides) => {
      rides.forEach((ride) => {
        // parse wait time
        const parsedTime = /([-\d]+)(?::(\d+))?/.exec(ride.tiempo_espera);
        let waitTime = null;
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
    return this.Cache.Wrap('openingHours', this.FetchOpeningTimesData.bind(this, this[sParkCalendarURL]), 60 * 60 * 24).then((data) => {
      data.forEach((range) => {
        // Rq: it seems that sometimes the 'date_legend' field contains 'open' but doesn't says the time range.
        const match = /(\d+):(\d+)\s*-\s*(\d+):(\d+)/.exec(range.date_legend);
        const type = (match) ? 'Operating' : 'Closed';
        let openingTime;
        let closingTime;
        if (match) {
          openingTime = Moment({
            hour: Number(match[1]),
            minute: Number(match[2]),
          });
          closingTime = Moment({
            hour: Number(match[3]),
            minute: Number(match[4]),
          });
        }

        this.Schedule.SetRange({
          startDate: Moment(range.date_from, 'YYYY-MM-DDTHH:mm:ss.SSSZZ').add(6, 'hour'),
          endDate: Moment(range.date_until, 'YYYY-MM-DDTHH:mm:ss.SSSZZ').add(6, 'hour'),
          type,
          specialHours: false,
          openingTime,
          closingTime,
        });
      });

      return Promise.resolve();
    });
  }

  FetchOpeningTimesData(urlEnDateTimes) {
    return this.HTTP({
      url: urlEnDateTimes,
    }).then((data) => {
      return Promise.resolve(data.result.data.allCalendarHorario.edges[0].node.calendarTiming);
    }).catch((e) => {
      this.Log(`Error fetching park hours: ${e}`);
      return Promise.resolve([]);
    });
  }

  // !! not used, too slow
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
