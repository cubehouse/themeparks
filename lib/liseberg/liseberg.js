const Moment = require('moment-timezone');
const cheerio = require('cheerio');
const Park = require('../park');

const sApiBase = Symbol('Liseberg API Base URL');
const sExpressPassOverviewPage = Symbol('Liseberg Expresspass Overview Url');

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

class Liseberg extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Liseberg';

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

    this[sRides] = [];
    this[sExpressPassIds] = [];
    // accept overriding the API base URL
    this[sApiBase] = options.apiBase || 'https://www.liseberg.com/en/api/';
    // accept overriding the ExpressPass Url
    this[sExpressPassOverviewPage] = options.ExpressPassOverviewPage || 'https://www.liseberg.se/handla/express-pass/';
  }

  /**
   * We are using the liseberg "maps" api which they use for their online map to get
   * all possible information on their rides
   */
  async getAdditionalRideInfos() {
    const seasonRides = [];
    // first get season filters
    const seasons = await this.Cache.Wrap('seasonFilters', () => this.HTTP({
      url: `${this[sApiBase]}map/filters`,
      returnFullResponse: false,
      mock: 'lisebergMapFilters',
    }).then((filtersResponse) => {
      const foundSeasons = filtersResponse.map((seasonObj) => {
        return seasonObj.season;
      });
      return Promise.resolve(foundSeasons);
    }), 60 * 60 * 24 * 7);
    await Promise.all(seasons.map(async (season) => {
      // then get the ride overview
      const seasonRidesResponse = await this.Cache.Wrap('poisByFilter', () => this.HTTP({
        url: `${this[sApiBase]}map/poisbyfilters`,
        data: {
          season,
          filters: 'rides-attractions',
        },
        returnFullResponse: false,
        mock: 'lisebergSeasonRides',
      }).then((poisResponse) => {
        return Promise.resolve(poisResponse);
      }), 60 * 60 * 24 * 7);
      seasonRidesResponse.forEach((seasonRide) => {
        const found = seasonRides.find((knownRide) => {
          return knownRide.id === seasonRide.id;
        });
        if (typeof found === 'undefined') {
          seasonRides.push(seasonRide);
        }
      });
    }));
    await Promise.all(seasonRides.map(async (seasonRide) => {
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
  }

  get FastPass() {
    return true;
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
   * this constructs the ride object with meta and waittime data
   * @param {Object} ride the rideobject from getWaitTimes
   */
  getFullRide(ride) {
    const rideUpdate = {
      waitTime: -1,
      active: false,
      status: 'Closed',
      name: ride.title ? ride.title : '???',
      fastPass: this[sExpressPassIds].indexOf(ride.title) !== -1,
      meta: {},
    };
    if (ride.additionalInformation) {
      ride.additionalInformation.forEach((additionalInfo) => {
        // check for waittime object "clock"
        if (additionalInfo.icon === 'clock') {
          if (additionalInfo.label !== 'Currently closed') {
            const calculatedWaitTime = this.calculateMaxWaitTime(
              additionalInfo.label.match(/^Queue:\s(\d*)-(\d*)\smin/)
            );
            if (calculatedWaitTime !== -1) {
              rideUpdate.waitTime = calculatedWaitTime;
              rideUpdate.active = true;
              rideUpdate.status = 'Operating';
            }
          }
        }
        rideUpdate.meta[additionalInfo.icon] = additionalInfo.label;
      });
    }
    Object.keys(ride).forEach((rideProp) => {
      if (unusedRideProps.indexOf(rideProp) === -1 && ride[rideProp] !== null) {
        rideUpdate.meta[rideProp] = ride[rideProp];
      }
    });
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

  async FetchWaitTimes() {
    await this.getAdditionalRideInfos();
    await this.getFastpassRides();
    this.updateWaitTimes();
    return Promise.resolve();
  }

  FetchOpeningTimes() {
    const currentDate = Moment.tz(new Date(), this.Timezone);
    return this.HTTP({
      url: `${this[sApiBase]}calendar/${currentDate.year()}-${currentDate.month() + 1}-${currentDate.date()}/${this[sOpeningTimeDays]}`,
      returnFullResponse: true,
      mock: 'lisebergOpeningTimes',
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
        if (openingTime.events.length > 0 && !openingTime.closed) {
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
module.exports = Liseberg;
