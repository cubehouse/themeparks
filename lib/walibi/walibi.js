// include core Park class
const Park = require('../park');

const sApiBase = Symbol('Walibi Holland API Base URL');
const sLangPref = Symbol('Language Preferences');

class Walibi extends Park {
  constructor(options = {}) {
    const year = new Date().getFullYear();

    options.name = options.name || 'Walibi Holland';

    // Walibi Holland from Google maps
    options.latitude = options.latitude || 52.44086770980989;
    options.longitude = options.longitude || 5.764768927236082;

    // Use the Android app's user-agent
    options.useragent = options.useragent || 'okhttp/3.9.1';

    // park's timezone
    options.timezone = 'Europe/Amsterdam';

    // inherit from base class
    super(options);

    // accept overriding the wait times URL
    this[sWaitTimesURL] = options.waitTimesURL || 'https://www.walibi.be/en/api/waiting_time?_format=json';

    // accept overriding the calendar URL
    this[sCalendarURL] = options.calendarURL || `https://www.walibi.nl/en/api/calendar/${year}?_format=json`;

    // accept overriding the language preference
    this[sLangPref] = options.langPref || 'en-US';
  }

  get FastPass() {
    return true;
  }

  /**
   * parses the Walibi Holland rideInfo and updates the rides
   * @param {Object[]} rideInfo An rideInfo Object from the API
   */
  updateWalibiRides(rideInfo) {
    rideInfo.forEach((ride) => {
      const rideUpdate = {
        waitTime: -1,
        active: false,
        status: 'Closed',
        name: ride.name,
        fastPass: false,
        lastUpdate: new Date(),
        meta: {
        },
        schedule: {
        }
      };

      // TODO: Add more statuses as they get discovered
      switch (ride.state) {
        case 'closed':
          // Do nothing, has already been set as default value.
          break;
        case 'open':
          // TODO: Check what the exact value of this is in the JSON once the park is back open again!
          rideUpdate.status = 'Operating';
          rideUpdate.active = true;
          rideUpdate.waitTime = Number(ride.waitingTime);
          break;
        case 'outOfOrder':
          rideUpdate.status = 'Down';
          rideUpdate.active= false;
          break;
        default:
          // Do nothing, this is just for the sake of having a switch case default statement
      }

      this.UpdateRide(rideUpdate.name, rideUpdate);
    });
  }

  FetchWaitTimes() {
    return this.HTTP({
      url: this[sWaitTimesURL],
      returnFullResponse: true,
      mock: 'walibiRides',
    }).then((data) => {
      this.updateWalibiRides(data.body);
      return Promise.resolve();
    });
  }

  updateWalibiOpeningHours(data) {
    if (!data || !data.week || !Array.isArray(data.week)) {
      return;
    }

    Object.keys(data.opening_hours).forEach((date) => {
      const schedule = {};
      if (data.opening_hours.date.status === "closed") {
        schedule.type = "Closed"
      } else {
        schedule = {
          startDate: Moment.tz(date, 'DD/MM/YYYY', this.Timezone),
          endDate: Moment.tz(date, 'YYYY-MM-DD', this.Timezone),
          openingTime: Moment.tz(data.opening_hours.date.mo_time, 'HH:mm', this.Timezone),
          closingTime: Moment.tz(data.opening_hours.date.mc_time, 'HH:mm', this.Timezone),
        };
      }

      this.Schedule.SetRange(schedule);
    });
  }

  FetchOpeningTimes() {
    return this.HTTP({
      url: this[sCalendarURL],
      returnFullResponse: true,
      json: true,
      user_agent: 'curl/7.73',
      mock: 'walibiOpeningHours',
    }).then((data) => {
      this.updateWalibiOpeningHours(data.body);
      return Promise.resolve();
    });
  }

  /* eslint-disable class-methods-use-this */
  // this park supports ride schedules
  get SupportsRideSchedules() {
    return true;
  }
  /* eslint-enable class-methods-use-this */
}

// export the class
module.exports = WalibiHolland;
