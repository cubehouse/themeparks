const Moment = require('moment');

// include core Park class
const Park = require('../park');

const rawRideData = require('./bellewaerdeData.js');

const rideData = {};
rawRideData.forEach((ride) => {
  rideData[ride.code] = ride;
});

const sApiBase = Symbol('Bellewaerde API Base URL');
const sCalendarURL = Symbol('Bellewaerde Calendar URL');

/**
 * Implements the Bellewaerde Park API
 * @class
 * @extends Park
 */
class Bellewaerde extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Bellewaerde';
    options.timezone = options.timezone || 'Europe/Brussels';
    options.latitude = options.latitude || 50.846996;
    options.longitude = options.longitude || 2.947948;

    // inherit from base class
    super(options);

    // API Options
    this[sApiBase] = options.apiBase || 'http://bellewaer.de/realtime/api/';
    this[sCalendarURL] = options.calendarURL || 'https://www.bellewaerde.be/en/api/calendar/';
  }

  FetchWaitTimes() {
    return this.HTTP({
      url: `${this[sApiBase]}api-realtime.php`,
    }).then((waittimes) => {
      // loop over returned data
      waittimes.forEach((ridetime) => {
        if (rideData[ridetime.id] && rideData[ridetime.id].type === 'Attractions') {
          // Check if the ride was closed or not
          if (ridetime.wait !== 999) {
            // Check if the ride has operating time
            if (ridetime.open !== '' && ridetime.close !== '') {
              this.UpdateRide(ridetime.id, {
                name: rideData[ridetime.id].name,
                waitTime: Number(ridetime.wait) || 0,
                meta: {
                  rideOpeningTime: Moment(ridetime.open, 'HH:mm').format(),
                  rideClosingTime: Moment(ridetime.close, 'HH:mm').format(),
                },
              });
            } else {
              this.UpdateRide(ridetime.id, {
                name: rideData[ridetime.id].name,
                waitTime: Number(ridetime.wait) || 0,
              });
            }
          } else {
            this.UpdateRide(ridetime.id, {
              name: rideData[ridetime.id].name,
              waitTime: -1,
            });
          }
        }
      });

      return Promise.resolve();
    });
  }

  /**
   * Request park opening times.
   * @returns {Promise}
   */
  FetchOpeningTimes() {
    // calculate how many (and which) years we want to check
    const endYear = Moment().tz(this.Timezone).add(this.ScheduleDays, 'days');
    const datePointer = Moment().tz(this.Timezone);
    const years = [];

    this.Log(`Fetching opening hours between ${datePointer.format()} and ${endYear.format()}`);

    // slide along between start and end until we go past endYear to get an array of required year combos
    while (datePointer.isSameOrBefore(endYear, 'year')) {
      years.push(datePointer.format('YYYY'));
      datePointer.add(1, 'year');
    }

    // loop through each year, calling FetchYearOpeningTimes
    return Promise.all(years.map((year) => {
      return this.FetchYearOpeningTimes(year);
    })).then((results) => {
      // inject results into calendar
      results.forEach((hours) => {
        hours.forEach((times) => {
          this.Schedule.SetDate(times);
        });
      });

      return results;
    });
  }

  /**
   * Fetch park opening times for a specific year and add to park's opening times
   * @param {String} [year]
   */
  FetchYearOpeningTimes(year) {
    return this.HTTP({
      url: this[sCalendarURL] + year,
      method: 'GET',
      data: {
        _format: 'json',
      },
      json: true,
    }).then((openingJSON) => {
      if (openingJSON === null) {
        return Promise.reject(new Error("API didn't return expected format"));
      }

      const result = [];
      Object.keys(openingJSON.opening_hours).forEach((key) => {
        // FYI, status: "open" / "closed" / "soldout"
        if (openingJSON.opening_hours[key].status === 'open') {
          result.push({
            date: Moment.tz(`${key}/${year}`, 'MM/DD/YYYY', this.Timezone),
            openingTime: Moment.tz(`${key}/${year}${openingJSON.opening_hours[key].mo_time}`, 'MM/DD/YYYYHH:mm', this.Timezone),
            closingTime: Moment.tz(`${key}/${year}${openingJSON.opening_hours[key].mc_time}`, 'MM/DD/YYYYHH:mm', this.Timezone),
            type: 'Operating',
          });
        } else {
          result.push({
            date: Moment.tz(`${key}/${year}`, 'MM/DD/YYYY', this.Timezone),
            type: 'Closed',
          });
        }
      });

      return result;
    });
  }
}

// export the class
module.exports = Bellewaerde;
