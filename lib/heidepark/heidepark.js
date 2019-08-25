// include core Park class
const Moment = require('moment-timezone');
const cheerio = require('cheerio');
const Park = require('../park');

const sApiBase = Symbol('Heide Park API Base URL');
const sApiVersion = Symbol('Heide Park API Version');
const sOpeningHoursUrl = Symbol('Heide Park Openinghours Url');

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

  /**
   * Parses the special events from the API Response
   * @param {Object} events Events in the API Response
   */
  addEvents(events) {
    events.forEach((event) => {
      const rideUpdate = {
        waitTime: 0,
        name: event.event_title ? event.event_title : '???',
        meta: {
          type: 'event',
          eventBody: event.event_body,
          eventLink: event.event_link,
          eventTeaserImg: event.event_teaser_img,
          eventImages: event.event_images,
        },
      };
      this.UpdateRide(rideUpdate.name, rideUpdate);
    });
  }

  /**
   * Checks the names from the api if the ride has fastpass
   * @param {String} name the ridename from the API Response
   */
  hasRideFastPass(name) {
    // this was taken from the park website
    switch (name) {
      case 'colossos':
      case 'flug_der_daemonen':
      case 'krake':
      case 'desert_race':
      case 'scream':
      case 'big_loop':
      case 'limit':
      case 'bobbahn':
      case 'grottenblitz':
      case 'wildwasserbahn':
      case 'ghostbusters':
        return true;

      default:
        return false;
    }
  }

  /**
   * parses the Heidepark timeEntries and updates the rides
   * @param {Object[]} timeEntries A timeEntries Object Array from the API
   * @param {String} type The Type of the timeEntries 'ride' | 'catering
   */
  updateHeideParkTimeEntries(timeEntries, type) {
    timeEntries.forEach((ride) => {
      const rideUpdate = {
        waitTime: -1,
        active: false,
        status: 'Closed',
        name: ride.alias ? ride.alias : '???',
        fastPass: this.hasRideFastPass(ride.alias ? ride.alias : '???'),
        meta: {
          type,
        },
      };

      if (ride.type === 'red') {
        // closed
      } else if (ride.type === 'time') {
        // waittime string in format "10 <small>Min.<\/small>"
        const waittimeArr = ride.msg.match(/(^\d*)\s/);
        rideUpdate.waitTime = waittimeArr ? parseInt(waittimeArr[1], 10) : 0;
        rideUpdate.active = true;
        rideUpdate.status = 'Operating';
      } else if (ride.type === 'yellow') {
        // no waittime but operating hours ( for catering as far as is saw it )
        const openingHoursArr = ride.msg.match(/(\d*)-(\d*)/);
        const openingHours = Moment().set({
          hours: openingHoursArr[1], minute: 0, second: 0, millisecond: 0,
        });
        const closingHours = Moment().set({
          hours: openingHoursArr[2], minute: 0, second: 0, millisecond: 0,
        });
        rideUpdate.waitTime = 0;
        rideUpdate.active = true;
        rideUpdate.status = 'Operating';
        rideUpdate.meta.openingHours = openingHours;
        rideUpdate.meta.closingHours = closingHours;
      }
      this.UpdateRide(rideUpdate.name, rideUpdate);
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
      this.updateHeideParkTimeEntries(result.catering.time_entries, 'catering');
      this.addEvents(result.todaybox.events);
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
