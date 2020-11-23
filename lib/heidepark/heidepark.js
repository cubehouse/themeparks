// include core Park class
const Moment = require('moment-timezone');
const cheerio = require('cheerio');
const Park = require('../park');

const sApiBase = Symbol('Heide Park API Base URL');
const sApiVersion = Symbol('Heide Park API Version');
const sOpeningHoursUrl = Symbol('Heide Park Openinghours Url');

const fastPassRides = [
  'colossos',
  'flug_der_daemonen',
  'krake',
  'desert_race',
  'scream',
  'big_loop',
  'limit',
  'bobbahn',
  'grottenblitz',
  'wildwasserbahn',
  'ghostbusters',
];

class HeidePark extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Heide Park';

    // Heide Park Resort from Google maps
    options.latitude = options.latitude || 53.0246445;
    options.longitude = options.longitude || 9.8716046;

    // Use the Android app's user-agent
    options.useragent = options.useragent || 'okhttp/3.9.1';

    // park's timezone
    options.timezone = 'Europe/Berlin';

    // inherit from base class
    super(options);

    // accept overriding the API base URL
    this[sApiBase] = options.apiBase || 'https://www.heide-park.de/api/';
    // accept overriding the OpeingHours Url
    this[sOpeningHoursUrl] = options.OpeningHoursUrl || 'https://www.heide-park.de/infos/oeffnungszeiten-anreise.html';
    // accept overriding API version
    this[sApiVersion] = options.apiVersion || 'v4';
  }

  get FastPass() {
    return true;
  }

  /** Convert a ride alias into a human-readable name */
  aliasToName(alias) {
    return alias.split('_').map((word) => {
      return word.substring(0, 1).toUpperCase() + word.substring(1);
    }).join(' ');
  }

  /**
   * parses the Heidepark timeEntries and updates the rides
   * @param {Object[]} timeEntries A timeEntries Object Array from the API
   * @param {String} type The Type of the timeEntries 'ride' | 'catering
   */
  updateHeideParkTimeEntries(timeEntries) {
    timeEntries.forEach((ride) => {
      const rideUpdate = {
        waitTime: -1,
        active: false,
        status: 'Closed',
        name: ride.alias ? this.aliasToName(ride.alias) : '???',
        fastPass: fastPassRides.indexOf(ride.alias ? ride.alias : '???') >= 0,
      };

      if (ride.type === 'red') {
        // closed
      } else if (ride.type === 'time') {
        // waittime string in format "10 <small>Min.<\/small>"
        const waittimeArr = ride.msg.match(/(^\d*)\s/);
        rideUpdate.waitTime = waittimeArr ? parseInt(waittimeArr[1], 10) : 0;
        rideUpdate.active = true;
        rideUpdate.status = 'Operating';
      }
      this.UpdateRide(ride.alias.toLowerCase(), rideUpdate);
    });
  }

  FetchWaitTimes() {
    return this.HTTP({
      url: `${this[sApiBase]}${this[sApiVersion]}`,
      returnFullResponse: true,
      mock: 'heideParkWaitTimes',
    }).then((parkData) => {
      let result = parkData.body.replace(/^\(/, '');
      result = JSON.parse(result.replace(/\);$/, ''));
      this.updateHeideParkTimeEntries(result.attractions.time_entries, 'ride');
      return Promise.resolve();
    });
  }

  /**
   * parses the openingtimes from the cherio objects and updates the schedule
   * @param {Object} $ The loaded cheerio object
   * @param {String} date the date string in format YYYY-MM-DD
   * @param {Object} hours the found openingtimes cheerio nodes
   * @param {Object} labels the found label cheerio nodes
   */
  updateParkOpeningHours($, date, hours, labels) {
    const schedule = {
      date: Moment.tz(date, 'YYYY-MM-DD', this.Timezone),
      type: 'Closed',
    };
    Object.keys(hours).forEach((key) => {
      if ($(labels[key]).text() === 'Park:') {
        const openingHours = $(hours[key]).text().match(/(\d*)\s-\s(\d*)/);
        schedule.openingTime = Moment.tz(`${date} ${openingHours[1]}:00`, 'YYYY-MM-DD HH:mm', this.Timezone);
        schedule.closingTime = Moment.tz(`${date} ${openingHours[2]}:00`, 'YYYY-MM-DD HH:mm', this.Timezone);
        schedule.type = 'Operating';
      }
    });
    this.Schedule.SetDate(schedule);
    // check for special hours
    Object.keys(labels).forEach((labelKey) => {
      if (!Number.isNaN(parseInt(labelKey, 10))) {
        const specialHour = $(labels[labelKey]).find('a');
        if (specialHour && specialHour.text() !== '') {
          // add specialHour
          schedule.type = specialHour.text().trim();
          schedule.specialHours = true;
          this.Schedule.SetDate(schedule);
        }
      }
    });
  }

  FetchOpeningTimes() {
    return this.HTTP({
      url: `${this[sOpeningHoursUrl]}`,
      returnFullResponse: true,
      mock: 'heideParkOpeningTimes',
    }).then((openingHoursHtmlPage) => {
      const $ = cheerio.load(openingHoursHtmlPage.body);
      const calendar = $('.cal');
      Object.keys(calendar).forEach((key) => {
        if (!Number.isNaN(parseInt(key, 10))) {
          const dayObj = $(calendar[key]).find('.js-cal-day-content');
          Object.keys(dayObj).forEach((dayKey) => {
            if (!Number.isNaN(parseInt(dayKey, 10))) {
              const date = $(dayObj[dayKey]).find('.day-info__header').text();
              const dateArr = date.match(/(\d*)\.(\d*)\.(\d*)/);
              const openingHours = $(dayObj[dayKey]).find('.day-info__hours');
              const openingLabels = $(dayObj[dayKey]).find('.day-info__label');
              this.updateParkOpeningHours($, `${dateArr[3]}-${dateArr[2]}-${dateArr[1]}`, openingHours, openingLabels);
            }
          });
        }
      });
      return Promise.resolve();
    });
  }
}

// export the class
module.exports = HeidePark;
