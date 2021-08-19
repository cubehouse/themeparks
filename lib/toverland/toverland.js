const Moment = require('moment');

// include core Park class
const Park = require('../park');

const sApiBase = Symbol('Toverland API Base URL');
const sApiVersion = Symbol('Toverland API Version');
const sCalendarURL = Symbol('Toverland Calendar URL');
const sLangPref = Symbol('Language Preferences');

class Toverland extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Toverland';

    // Heide Park Resort from Google maps
    options.latitude = options.latitude || 51.39688449207086;
    options.longitude = options.longitude || 5.984768038311225;

    // Use the Android app's user-agent
    options.useragent = options.useragent || 'okhttp/3.9.1';

    // park's timezone
    options.timezone = 'Europe/Amsterdam';

    // inherit from base class
    super(options);

    // accept overriding API version
    this[sApiVersion] = options.apiVersion || 'v1';

    // accept overriding the API base URL
    this[sApiBase] = options.apiBase || 'https://api.toverland.com/';

    // accept overriding the calendar URL
    this[sCalendarURL] = options.calendarURL || 'https://www.toverland.com/?type=16635183284';

    // accept overriding the language preference
    this[sLangPref] = options.langPref || 'en';
  }

  get FastPass() {
    return false;
  }

  /**
   * parses the Toverland operationInfo and updates the rides
   * @param {Object[]} operationInfo An operationInfo Object Array from the API
   * @param {String} type The Type of the timeEntries ['ride', 'halloween'
   */
  updateToverlandOperationInfo(operationInfo) {
    const getTranslatedValue = (sourceObject) => {
      if (!sourceObject || sourceObject[this[sLangPref]]) {
        return '';
      }

      return sourceObject[this[sLangPref]];
    };

    operationInfo.forEach((ride) => {
      const rideUpdate = {
        waitTime: -1,
        active: false,
        status: 'Closed', // 'Operating', 'Refurbishment', 'Down', 'Closed'
        name: ride.name,
        fastPass: false,
        latitude: ride.latitude,
        longitude: ride.longitude,
        meta: {
          ride_type: getTranslatedValue(ride.header_description),
          short_description: getTranslatedValue(ride.short_description),
          description: getTranslatedValue(ride.desription),
          thumbnail: ride.thumbnail,
        },
      };

      // TODO: Add more statuses as they get discovered
      switch (ride.last_status.status.name.en) {
        case 'Closed':
          // Do nothing, has already been set as default value.
          break;
        case 'Open':
          rideUpdate.status = 'Operating';
          rideUpdate.active = true;
          rideUpdate.waitTime = Number(ride.last_waiting_time.waiting_time);
          break;
        default:
          // Do nothing, just for the sake of having a switch case statement that is
      }

      this.UpdateRide(ride.id.toString(), rideUpdate);
    });
  }

  FetchWaitTimes() {
    return this.HTTP({
      url: `${this[sApiBase]}${this[sApiVersion]}/park/ride/operationInfo/list`,
      headers: {
        Authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI4IiwianRpIjoiMTRlZDg0MjdhOTk3ZWFjNzlkMjFlMzQ3NWZjYjU0YmY2MGNjZDA2MTg4NWQ5MGNhNTc2OGQ1YzNkNTRhMzFmMmJlNGU2OTE1MGEwYmNmZjkiLCJpYXQiOjE2MDAxNTYzMTgsIm5iZiI6MTYwMDE1NjMxOCwiZXhwIjoxNjMxNjkyMzE4LCJzdWIiOiIzIiwic2NvcGVzIjpbXX0.EvvdV2Faf1XLvLthDkgEfuC_GCEzP0fDwiWocWB7wwM5U00uuuDnXD_RKw1ts0awzL4mZu-65INP7mx2rupHDCkI_5wbFHf_bHuduCjUVHgYvaJ_XGpYjjhHqGLI5K2LZ6GEv5w2EonY3-SG7Y54uS7diXcu9xRwpKXX7PU2yVOw-xJA9ayfWaRHRdlyi1LAWe67Q9Y8oJiaDVDHGhYCgxOHhlfUqKkFyVJVCruKbVoLGFLL9tpk6mxpp_b14GUsiCjmsk9e0BSZZ9I3h4UVhpc9MvkofCsczgfABgyZp71fWvpuF-k0H1veoqoL2C4hdkZizlcGkhryV05i7KaflJezZ554xoFj5DJgxoLmStHTlaKF6l4740aJ-iuSNn2XvV3jKLbKy-t8aNWeCiuqMmRnPlHSnqYC2Yqz4XMUx3z3IVLsQj2ig3EVVAWafGiWxaFc6JyiGtIo7O_beJtIfcvwy_A7ytb0jt13zWwQHw32KQplo0XL7YGxinM3hialUhKSpSuVpwGQgrG68UnU1kkAq5n5P38vvXa1tAKsXnANuc2aDje1s20umKThmT-b728UoJ-moZ9MHpqEhqxsRjVoFSK2Uhnok_vtm-Uf7GAFIHuGVlsKa-r8gdnATHQgE5gxO7N8EFTt_1wFFl3vMjAwp9xJpw9hPgwAQ6ww210',
      },
      returnFullResponse: true,
      mock: 'toverlandOperationInfo',
    }).then((data) => {
      this.updateToverlandOperationInfo(data.body);
      return Promise.resolve();
    });
  }

  updateToverlandOpeningHours(data) {
    if (!data || !data.week || !Array.isArray(data.week)) {
      return;
    }

    data.week.forEach((day) => {
      const schedule = {
        startDate: Moment.tz(day.date.full, 'YYYY-MM-DD', this.Timezone),
        endDate: Moment.tz(day.date.full, 'YYYY-MM-DD', this.Timezone),
        openingTime: Moment.tz(day.time_open, 'HH:mm', this.Timezone),
        closingTime: Moment.tz(day.time_close, 'HH:mm', this.Timezone),
      };
      if (day.time_open === '00:00' && day.time_close === '00:00') {
        schedule.type = 'Closed';
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
      mock: 'toverlandOpeningHours',
    }).then((data) => {
      this.updateToverlandOpeningHours(data.body);
      return Promise.resolve();
    });
  }
}

// export the class
module.exports = Toverland;
