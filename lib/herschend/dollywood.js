// import the base Herschend class
const Moment = require('moment-timezone');
const HerschendBase = require('./herschendparkbase');

/**
 * Dollywood
 * @class
 * @extends HerschendBase
 */
class Dollywood extends HerschendBase {
  /**
   * Create a new Dollywood object
   */
  constructor(options = {}) {
    options.name = options.name || 'Dollywood';
    options.timezone = options.timezone || 'America/New_York';

    // set resort's general center point
    options.latitude = options.latitude || 35.795329;
    options.longitude = options.longitude || -83.530886;

    options.parkID = 1;
    options.calendarUrl = 'www.dollywood.com';
    options.parkIDs = 'A8F3517D-4606-4387-B275-DC607DCD6DDE';

    // inherit from base class
    super(options);
  }

  // override calendar fetching for Dollywood
  async FetchOpeningTimes() {
    const calendarHTML = await this.Cache.Wrap('dollywoodCalendarAPI', () => {
      return this.HTTP({
        url: 'https://www.dollywood.com/calendar?mapp=1',
      });
    }, 60 * 60 * 12);

    if (!calendarHTML) return Promise.reject(new Error('Unable to fetch Dollywood calendar HTML'));

    // find our calendarDatasourceItemId token for API requests
    const match = /value="([^"]+)" id="calendarDatasourceItemId/.exec(calendarHTML);
    if (!match) return Promise.reject(new Error('Unable to find calendarDatasourceItemId token in Dollywood calendar HTML'));

    const APItoken = match[1];

    const rangeStart = Moment.tz(this.Timezone);
    const rangeEnd = rangeStart.clone().add(3, 'months');

    // fetch each month we want from the API
    for (let date = rangeStart.clone(); date.isSameOrBefore(rangeEnd); date.add(1, 'month')) {
      const monthToFetch = `${date.month() + 1}-1-${date.year()}`;
      // eslint-disable-next-line no-await-in-loop
      const monthData = await this.HTTP({
        url: 'https://www.dollywood.com/api/cxa/Calendar/GetCalendarHoursAndEvents',
        data: {
          did: APItoken,
          sd: monthToFetch,
        },
      });
      if (!monthData) return Promise.reject(new Error(`Unable to fetch Dollywood calendar for month ${monthToFetch}`));

      monthData.forEach((event) => {
        // skip non Theme Park times
        if (event.eventName !== 'Theme Park') return;

        const eventDate = Moment.tz(event.d, 'MM/DD/YYYY', this.Timezone);

        if (event.hours === 'Closed') {
          this.Schedule.SetDate({
            date: eventDate,
            type: 'Closed',
          });
        } else {
          const timeMatch = /(\d{1,2}):(\d{2})\s([AP]M)\s*-\s*(\d{1,2}):(\d{2})\s([AP]M)/.exec(event.hours);
          if (!timeMatch) {
            this.Log(`Unable to parse Dollywood calendar time string: ${event.hours}`);
            return;
          }

          const openingHour = (Number(timeMatch[1]) + ((timeMatch[3] === 'PM') ? 12 : 0)) % 24;
          const closingHour = (Number(timeMatch[4]) + ((timeMatch[6] === 'PM') ? 12 : 0)) % 24;

          const openingTime = eventDate.clone()
            .hours(openingHour)
            .minutes(Number(timeMatch[2]));
          const closingTime = eventDate.clone()
            .hours(closingHour)
            .minutes(Number(timeMatch[5]));

          this.Schedule.SetDate({
            date: eventDate,
            openingTime,
            closingTime,
          });
        }
      });
    }

    return Promise.resolve();
  }
}

module.exports = Dollywood;
