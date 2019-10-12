const Moment = require('moment-timezone');
const cheerio = require('cheerio');
const Park = require('../park');

const sApiBase = Symbol('Liseberg API Base URL');
const sRideOverviewPage = Symbol('Liseberg Rideoverview Url');
const sExpressPassOverviewPage = Symbol('Liseberg Expresspass Overview Url');

const sRideQueueUris = Symbol('Liseberg Ridequeue uris');
const sRideQueues = Symbol('Liseberg Ridequeues');
const sExpressPassIds = Symbol('Liseberg Expresspass Ride Ids');
const sOpeningTimeDays = Symbol('Opening Times for X Days');
const sRides = Symbol('Liseberg Rides');

// ride properties which we dont need to return
const unusedRideProps = [
  'id',
  'title',
  'type',
  'additionalInformation',
];

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

    this[sRideQueueUris] = [];
    this[sRideQueues] = [];
    this[sRides] = [];
    this[sExpressPassIds] = [];
    // accept overriding the API base URL
    this[sApiBase] = options.apiBase || 'https://www.liseberg.com/en/api/';
    // accept overriding the RideOverview Url
    this[sRideOverviewPage] = options.RideOverviewPage || 'https://www.liseberg.com/rides-attractions/';
    // accept overriding the ExpressPass Url
    this[sExpressPassOverviewPage] = options.ExpressPassOverviewPage || 'https://www.liseberg.se/handla/express-pass/';
  }

  /**
   * We are using the liseberg "maps" api which they use for their online map to get
   * all possible information on their rides
   */
  async getAdditionalRideInfos() {
    // first get season filters
    const filtersResponse = await this.HTTP({
      url: `${this[sApiBase]}map/filters`,
      returnFullResponse: false,
      mock: 'lisebergMapFilters',
    });
    const seasons = filtersResponse.map((seasonObj) => {
      return seasonObj.season;
    });
    return Promise.all(seasons.map(async (season) => {
      // then get the ride overview
      const seasonRidesResponse = await this.HTTP({
        url: `${this[sApiBase]}map/poisbyfilters`,
        data: {
          season,
          filters: 'rides-attractions',
        },
        returnFullResponse: false,
        mock: 'lisebergSeasonRides',
      });
      await Promise.all(seasonRidesResponse.map(async (seasonRide) => {
        // finally get the ride information
        const rideResponse = await this.HTTP({
          url: `${this[sApiBase]}map/extendedpoibyid/${seasonRide.id}`,
          returnFullResponse: false,
          mock: 'lisebergSeasonRide',
        });
        const found = this[sRides].findIndex((ride) => {
          return ride.id === rideResponse.id;
        });
        if (found === -1) {
          this[sRides].push(rideResponse);
        }
      }));
      return Promise.resolve();
    }));
  }

  /**
   * we have to do this call to get a ride overview with the
   * right ids to get the waittimes later (Liseberg website does it the same way)
   * unfortunately the "map rides" have different ids than the "waittime rides"
   */
  getRideQueUris() {
    return this.HTTP({
      url: this[sRideOverviewPage],
      returnFullResponse: true,
      mock: 'lisebergRideOverview',
    }).then((rideOverview) => {
      const $ = cheerio.load(rideOverview.body);
      $('.queue').each((index, element) => {
        const name = $(element).parent().parent().parent()
          .find('.card__heading')
          .text();
        this[sRideQueueUris].push({
          name,
          uri: $(element).attr('data-queue-api').replace('/en/api/', '')
        });
      });
      return Promise.resolve();
    });
  }

  /**
   * we have to do this call to get the fastpass rides
   * unfortunately the "map rides" have different ids than the "fastpass rides"
   */
  getFastpassRides() {
    return this.HTTP({
      url: this[sExpressPassOverviewPage],
      returnFullResponse: true,
      mock: 'lisebergExpressPassOverview',
    }).then((fastpassOverview) => {
      const $ = cheerio.load(fastpassOverview.body);
      $('.card-carousel__list-item').each((index, element) => {
        const name = $(element).find('.card__heading').text();
        if (name !== '') {
          this[sExpressPassIds].push(name);
        }
      });
      return Promise.resolve();
    });
  }

  /**
   * this gets the waittime object for a specific ride id
   * @param {String} uri the waittime endpoint for a single ride id
   */
  getWaitTimes(uri) {
    return this.HTTP({
      url: `${this[sApiBase]}${uri}`,
      returnFullResponse: true,
      mock: 'lisebergWaitTime',
    }).then((response) => {
      return Promise.resolve(response.body);
    });
  }

  /**
   * we have to parse liseberg waittime "from to" to a single value (max-value is used)
   * @param {Array} regexMatch the matched regex array
   */
  calculateMaxWaitTime(regexMatch) {
    if (regexMatch !== null) {
      // regex matched, check for the groups
      if (regexMatch[1]
        && regexMatch[2]
        && !Number.isNaN(parseInt(regexMatch[1], 10))
        && !Number.isNaN(parseInt(regexMatch[2], 10))) {
        // min and max value was found
        return parseInt(regexMatch[1], 10) <= parseInt(regexMatch[2], 10)
          ? parseInt(regexMatch[2], 10) : parseInt(regexMatch[1], 10);
      }
    }
    return -1;
  }

  /**
   * because of different ids we try to map the different attraction properties
   * into one ride object to update the waittime later
   * @param {Object} ride the rideobject from getWaitTimes
   */
  getFullRide(ride) {
    const rideUpdate = {
      waitTime: -1,
      active: false,
      status: 'Closed',
      name: ride.title ? ride.title : '???',
      fastPass: this[sExpressPassIds].indexOf(ride.title) !== -1,
    };
    rideUpdate.meta = {};
    // "Included in Ride Pass" indicates Fastpass
    if (ride.additionalInformation) {
      ride.additionalInformation.forEach((additionalInfo) => {
        rideUpdate.meta[additionalInfo.icon] = additionalInfo.label;
      });
    }
    Object.keys(ride).forEach((rideProp) => {
      if (unusedRideProps.indexOf(rideProp) === -1 && ride[rideProp] !== null) {
        rideUpdate.meta[rideProp] = ride[rideProp];
      }
    });
    const foundRideQueue = this[sRideQueues].find((rideQueue) => {
      return rideQueue.name === ride.title;
    });
    if (typeof foundRideQueue !== 'undefined') {
      if (foundRideQueue.status !== 'Currently closed') {
        const calculatedWaitTime = this.calculateMaxWaitTime(
          foundRideQueue.status.match(/^Queue:\s(\d*)-(\d*)\smin/)
        );
        if (calculatedWaitTime !== -1) {
          rideUpdate.waitTime = calculatedWaitTime;
          rideUpdate.active = true;
          rideUpdate.status = 'Operating';
        }
      }
    }
    return rideUpdate;
  }

  /**
   * updates the waittime
   */
  updateWaitTimes() {
    this[sRides].forEach((ride) => {
      const rideUpdate = this.getFullRide(ride);
      this.UpdateRide(ride.id, rideUpdate);
    });
  }

  /**
   * get the queue objects with the waittime. sometimes the api returns no waittime and no id... couldnt figure out why
   */
  async getRideQueues() {
    return Promise.all(this[sRideQueueUris].map(async (rideQueue) => {
      const ride = await this.getWaitTimes(rideQueue.uri);
      if (ride.id !== -1) {
        this[sRideQueues].push(ride);
      } else {
        this[sRideQueues].push({
          id: parseInt(rideQueue.uri.replace('queue/', ''), 10),
          name: rideQueue.name,
          status: 'Currently closed',
        });
      }
      return Promise.resolve();
    }));
  }

  async FetchWaitTimes() {
    await this.getAdditionalRideInfos();
    await this.getRideQueUris();
    await this.getFastpassRides();
    await this.getRideQueues();
    this.updateWaitTimes();
    return Promise.resolve();
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
        if (!openingTime.closed) {
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
