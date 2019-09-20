// Uses "The Experience Engine" framework for their wait times
const Moment = require('moment-timezone');
const TE2Park = require('./te2parkbase');

/**
 * Implements the CedarFairPark API framework.
 * @class
 * @extends SeaWorld
 */
class CedarFairPark extends TE2Park {
  /**
   * Create new CedarFairPark Object.
   * This object should not be called directly, but rather extended for each of the individual Cedar Fair parks
   * @param {Object} options
   * @param {String} options.park_id ID of the park to access the API for
   * @param {String} [options.auth_token] Auth token to use to connect to the API
   * @param {String} [options.api_base] Base URL to access the API
   * @param {String[]} [options.ride_types] Array of types that denote rides at the park (to avoid listing restaurants/toilets etc. as rides)
   * @param {String[]} [options.special_hours] Array of park IDs to combine with main park for special hours (eg. scaryfarm)
   */
  constructor(options = {}) {
    options.name = options.name || 'Cedar Fair Park';

    // change defaults before calling super()
    options.auth_token = options.auth_token || 'Mobile_API:merl4yU2';
    options.api_base = options.api_base || 'https://cf.te2.biz/rest/';

    // inherit from base class
    super(options);
  }

  FetchOpeningTimes() {
    return this.HTTP({
      url: `https://cf.te2.biz/v2/venues/${this.ParkID}/venue-hours`,
      data: {
        days: 120,
      },
    }).then((resp) => {
      resp.days.forEach((day) => {
        const today = Moment(day.date);

        day.hours.forEach((schedule) => {
          // skip if we're a special event... and closed? so, a nothing
          if (schedule.label !== 'Park' && schedule.status === 'CLOSED') return;

          this.Schedule.SetDate({
            date: today,
            // clone today and overwrite the hours from the park legend
            openingTime: Moment(schedule.schedule.start),
            closingTime: Moment(schedule.schedule.end),
            // eslint-disable-next-line no-nested-ternary
            type: schedule.label === 'Park' ? (schedule.status === 'OPEN' ? 'Operating' : 'Closed') : (schedule.label),
            specialHours: schedule.label !== 'Park',
          });
        });
      });

      return Promise.resolve();
    });
  }
}

module.exports = CedarFairPark;
