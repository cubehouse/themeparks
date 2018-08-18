// base park objects
const Moment = require('moment-timezone');
const Park = require('../park.js');

// Moment date/time library

// API settings
const baseUrl = 'http://pulse.hfecorp.com/api/waitTimes/';

const sParkID = Symbol('Park ID');
const sCalendarURL = Symbol('Calendar URL');
const sParkIDs = Symbol('Park Calendar IDs');
const sCalendarAuth = Symbol('API Authentication String');

/**
 * Implements the Walt Disney World API framework. All Disney parks use this one API.
 * @class
 * @extends Park
 */
class HerschendBase extends Park {
  /**
   * Create new HerschendBase Object.
   * This object should not be called directly, but rather extended for each of the individual Herschend Parks
   * @param {Object} options
   * @param {String} options.parkID Herschend API park ID
   * @param {String} options.calendarUrl Herschend calendar base URL
   * @param {String} options.calendarAuth Herschend calendar authentication string
   * @param {String} options.parkIDs Herschend calendar "parkids" value
   */
  constructor(options = {}) {
    // inherit from base class
    super(options);

    // check we have our park_id
    if (!options.parkID) {
      throw new Error('No parkID supplied for Herschend park');
    }
    this[sParkID] = options.parkID;

    if (!options.calendarUrl) {
      throw new Error('No calendar URL supplied for Herschend park');
    }
    this[sCalendarURL] = options.calendarUrl;

    if (!options.parkIDs) {
      throw new Error('No parkids supplied for Herschend park');
    }
    this[sParkIDs] = options.parkIDs;

    this[sCalendarAuth] = options.calendarAuth || 'extranet\\apiuser:Jw7odhwFHpK4Jg';
  }

  /**
   * Fetch this Herschend Park's waiting times
   * @returns {Promise}
   */
  FetchWaitTimes() {
    return this.HTTP({
      url: baseUrl + this[sParkID],
      mock: `herschend_${this[sParkID]}_waittimes`,
    }).then((body) => {
      body.forEach((ride) => {
        let waittime;
        if (ride.operationStatus.includes('CLOSED') || ride.operationStatus.includes('UNKNOWN')) {
          // Assume that all "UNKNOWN" times are closed rides.
          waittime = -1;
        } else if (ride.waitTimeDisplay.includes('UNDER')) {
          // Wait time is not defined if text says "Under x minutes" - we'll set the ride time to x
          waittime = parseInt(ride.waitTimeDisplay.split(' ')[1], 10);
        } else {
          waittime = parseInt(ride.waitTime, 10);
        }

        this.UpdateRide(ride.rideId, {
          name: ride.rideName,
          waitTime: waittime,
        });
      });

      return Promise.resolve();
    });
  }

  /**
   * Fetch this Herschend Park's opening times
   * @returns {Promise}
   */
  FetchOpeningTimes() {
    // get today's date and add on a month to get a decent range of dates
    const rangeStart = Moment.tz(this.Timezone).format('YYYY-MM-DD');

    return this.HTTP({
      url: `https://${this[sCalendarURL]}/sitecore/api/hfe/hfedata/dailyschedulebytime`,
      data: {
        date: rangeStart,
        days: 90,
        parkids: this[sParkIDs],
      },
      headers: {
        Authorization: `Basic ${Buffer.from(this[sCalendarAuth]).toString('base64')}`,
      },
      mock: `herschend_${this[sParkID]}_calendar`,
    }).then((scheduleData) => {
      // parse each schedule entry
      scheduleData.forEach((day) => {
        if (day.schedule.parkHours[0].from) {
          this.Schedule.SetDate({
            date: Moment.tz(day.date, 'YYYY-MM-DD', this.Timezone),
            openingTime: Moment.tz(day.schedule.parkHours[0].from, 'YYYY-MM-DDTHH:mm:ss', this.Timezone),
            closingTime: Moment.tz(day.schedule.parkHours[0].to, 'YYYY-MM-DDTHH:mm:ss', this.Timezone),
          });
        } else {
          this.Schedule.SetDate({
            date: Moment.tz(day.date, 'YYYY-MM-DD', this.Timezone),
            type: 'Closed',
          });
        }
      });

      Promise.resolve();
    });
  }
}

// export just the Base Herschend Park class
module.exports = HerschendBase;
