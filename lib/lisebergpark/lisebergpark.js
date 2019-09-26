const Moment = require('moment-timezone');
const cheerio = require('cheerio');
const Park = require('../park');

const sApiBase = Symbol('Liseberg API Base URL');
const sRideOverviewPage = Symbol('Liseberg Rideoverview Url');

const sRideQueues = Symbol('Liseberg Ridequeues');
const sOpeningTimeDays = Symbol('Opening Times for X Days');

class LisebergPark extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Liseberg Park';

    // Liseberg from Google maps
    options.latitude = options.latitude || 57.6962467;
    options.longitude = options.longitude || 11.9856468;

    options.useragent = options.useragent || 'okhttp/3.9.1';

    // park's timezone
    options.timezone = 'Europe/Stockholm';

    // inherit from base class
    super(options);

    // for how many days in the future you want opening times?
    this[sOpeningTimeDays] = options.openingTimeDays || 30;

    this[sRideQueues] = [];
    // accept overriding the API base URL
    this[sApiBase] = options.apiBase || 'https://www.liseberg.com/en/api/';
    // accept overriding the OpeingHours Url
    this[sRideOverviewPage] = options.OpeningHoursUrl || 'https://www.liseberg.com/rides-attractions/';
    // accept overriding API version
  }

  getRideQueUris() {
    return this.HTTP({
      url: `${this[sRideOverviewPage]}`,
      returnFullResponse: true,
      mock: 'lisebergRideOverview',
    }).then((rideOverview) => {
      const $ = cheerio.load(rideOverview.body);
      $('.queue').each((index, element) => {
        this[sRideQueues].push($(element).attr('data-queue-api').replace('/en/api/', ''));
      });
      return Promise.resolve();
    });
  }

  getWaitTimes(uri) {
    return this.HTTP({
      url: `${this[sApiBase]}${uri}`,
      returnFullResponse: true,
      mock: 'lisebergWaitTime',
    }).then((response) => {
      return Promise.resolve(response.body);
    });
  }

  updateWaitTime(ride) {
    const rideUpdate = {
      waitTime: -1,
      active: false,
      status: 'Closed',
      name: ride.name ? ride.name : '???',
      fastPass: false,
    };
    if (ride.status === 'Currently closed') {
      // closed
    } else {
      // ???
    }
    this.UpdateRide(ride.id, rideUpdate);
  }

  FetchWaitTimes() {
    const self = this;
    return this.getRideQueUris().then(() => {
      return Promise.all(this[sRideQueues].map((rideUri) => {
        return self.getWaitTimes(rideUri).then((ride) => {
          self.updateWaitTime(ride);
          return Promise.resolve();
        });
      }));
    });
  }

  FetchOpeningTimes() {
    const currentDate = Moment.tz(new Date(), this.Timezone);
    return this.HTTP({
      url: `${this[sApiBase]}calendar/${currentDate.year()}-${currentDate.month() + 1}-${currentDate.date()}/${this[sOpeningTimeDays]}`,
      returnFullResponse: true,
      mock: 'lisebergWaitTime',
    }).then((response) => {
      response.body.forEach((openingTime) => {
        const schedule = {
          date: Moment.tz(openingTime.dateRaw, this.Timezone),
          type: 'Closed',
        };
        if (typeof openingTime.openingHoursDetailed.from !== 'undefined' && openingTime.openingHoursDetailed.to !== 'undefined') {
          schedule.openingTime = Moment.tz(`${currentDate.year()}-${currentDate.month() + 1}-${currentDate.date()} ${openingTime.openingHoursDetailed.from}:00`, 'YYYY-MM-DD HH:mm', this.Timezone);
          schedule.closingTime = Moment.tz(`${currentDate.year()}-${currentDate.month() + 1}-${currentDate.date()} ${openingTime.openingHoursDetailed.to}:00`, 'YYYY-MM-DD HH:mm', this.Timezone);
          schedule.type = 'Operating';
        }
        this.Schedule.SetDate(schedule);
        if (openingTime.events.length > 0) {
          // special events for that day
          openingTime.events.forEach((specialEvent) => {
            schedule.type = specialEvent.heading;
            schedule.specialHours = true;
            this.Schedule.SetDate(schedule);
          });
        }
      });
      return Promise.resolve();
    });
  }
}
// export the class
module.exports = LisebergPark;
