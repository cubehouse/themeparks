const Moment = require('moment-timezone');
const cheerio = require('cheerio');
const Park = require('../park');

const sApiBase = Symbol('Liseberg API Base URL');
const sRideOverviewPage = Symbol('Liseberg Rideoverview Url');

const sRideQueues = Symbol('Liseberg Ridequeues');
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

    this[sRideQueues] = [];
    this[sRides] = [];
    // accept overriding the API base URL
    this[sApiBase] = options.apiBase || 'https://www.liseberg.com/en/api/';
    // accept overriding the OpeingHours Url
    this[sRideOverviewPage] = options.OpeningHoursUrl || 'https://www.liseberg.com/rides-attractions/';
    // accept overriding API version
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
      name: ride.name ? ride.name : '???',
      fastPass: false,
    };
    const foundRide = this[sRides].find((rideInfo) => {
      return rideInfo.title === ride.name;
    });
    if (typeof foundRide !== 'undefined') {
      rideUpdate.meta = {};
      // "Included in Ride Pass" indicates Fastpass
      if (foundRide.additionalInformation) {
        const ticket = foundRide.additionalInformation.filter((info) => {
          return info.icon === 'ticket';
        });
        if (ticket.length > 0) {
          rideUpdate.fastPass = ticket.map((ticketInfo) => {
            if (ticketInfo.label.indexOf('Included in Ride Pass') !== -1) {
              return true;
            }
            return false;
          }).reduce((fastpass) => {
            return fastpass;
          });
        }
        const ruler = foundRide.additionalInformation.filter((info) => {
          return info.icon === 'ruler';
        });
        if (ruler.length > 0) {
          rideUpdate.meta.ruler = ruler[0].label;
        }
      }
      Object.keys(foundRide).forEach((rideProp) => {
        if (unusedRideProps.indexOf(rideProp) === -1 && foundRide[rideProp] !== null) {
          rideUpdate.meta[rideProp] = foundRide[rideProp];
        }
      });
    }
    return rideUpdate;
  }

  /**
   * updates the waittime
   * @param {Object} ride the ride from getWaitTimes
   */
  updateWaitTime(ride) {
    const rideUpdate = this.getFullRide(ride);
    if (ride.status !== 'Currently closed') {
      const calculatedWaitTime = this.calculateMaxWaitTime(
        ride.status.match(/^Queue:\s(\d*)-(\d*)\smin/)
      );
      if (calculatedWaitTime !== -1) {
        rideUpdate.waitTime = calculatedWaitTime;
        rideUpdate.active = true;
        rideUpdate.status = 'Operating';
      }
    }
    this.UpdateRide(ride.id, rideUpdate);
  }

  async FetchWaitTimes() {
    await this.getAdditionalRideInfos();
    await this.getRideQueUris();
    return Promise.all(this[sRideQueues].map(async (rideUri) => {
      const ride = await this.getWaitTimes(rideUri);
      if (ride.id !== -1) {
        this.updateWaitTime(ride);
      }
      return Promise.resolve();
    }));
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
