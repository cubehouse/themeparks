// include core Park class
const Moment = require('moment-timezone');
const Park = require('../park');

const sApiBase = Symbol('Heide Park API Base URL');
const sApiVersion = Symbol('Heide Park API Version');

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

  FetchOpeningTimes() {
    return this.HTTP({
      url: 'https://www.heide-park.de/umbraco/api/openinghours/getcalendar',
      method: 'GET',
      headers: {
        Referer: 'https://www.heide-park.de/en/plan-your-visit/before-you-visit/opening-hours/',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }).then((calendarData) => {
      const parkTimes = calendarData.Locations.find(x => x.locationName === 'Fahrgeschäfte schließen 1 Stunde vor Parkschluss'); // My guess is that they'll change this regulary, however if translated it literally states: 'The attractions will close 1 hour before the park closes'
      if (parkTimes) {
        parkTimes.days.forEach((day) => {
          const matchTimes = /(\d+:\d+)?\s*-\s*(\d+:\d+)/.exec(day.openingHours);
          if (!matchTimes) return;

          // For now I am unsure how this works, because the German government didn't approve Heide-Park to open for a long time, so they purged the entire calendar, however, knowing the German clock system, it'll be in HH:mm format, as Legoland Deutschland uses HH:mm as well.
          const openingHour = Number(matchTimes[1]);
          const closingHour = Number(matchTimes[2]);

          // parse out the date
          const year = Number(day.key.slice(0, 4));
          const month = Number(day.key.slice(4, 6)) - 1;
          const date = Number(day.key.slice(6, 8));

          const opening = Moment({
            year,
            month,
            day: date,
            hour: openingHour,
            minute: 0,
            second: 0,
            millisecond: 0,
          });
          const closing = opening.clone().hours(closingHour);

          this.Schedule.SetDate({
            date: opening,
            openingTime: opening,
            closingTime: closing,
            type: 'Operating',
          });
        });
      }
    });
  }
}

// export the class
module.exports = HeidePark;
