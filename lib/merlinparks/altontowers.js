const Moment = require('moment-timezone');
const MerlinPark = require('./merlinpark');
const defaultFallbackData = require('./altontowers_data.json');

/**
 * Alton Towers
 * @class
 * @extends MerlinPark
 */
class AltonTowers extends MerlinPark {
  /**
   * Create a new AltonTowers object
   */
  constructor(options = {}) {
    options.name = options.name || 'Alton Towers';
    options.timezone = options.timezone || 'Europe/London';

    // set park's location as it's entrance
    options.latitude = options.latitude || 52.991064;
    options.longitude = options.longitude || -1.892292;

    // Park API options
    options.apiKey = options.apiKey || 'e6c2bbf8-da54-47a2-a5ed-8b7797137113';
    options.initialDataVersion = options.initialDataVersion || '2019-05-01T14:58:20Z';

    // Fallback data if the /data webservice doesn't work
    options.fallbackData = options.fallbackData || defaultFallbackData;

    // inherit from base class
    super(options);
  }

  FetchOpeningTimes() {
    return this.HTTP({
      url: 'https://www.altontowers.com/umbraco/api/openinghours/getcalendar',
      method: 'GET',
      headers: {
        Referer: 'https://www.altontowers.com/plan-your-visit/before-you-visit/opening-times/',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }).then((calendarData) => {
      const parkTimes = calendarData.Locations.find(x => x.locationName === 'Theme Park');
      if (parkTimes) {
        parkTimes.days.forEach((day) => {
          const matchTimes = /(\d+)([ap]m)?\s*-\s*(\d+)([ap]m)/.exec(day.openingHours);
          if (!matchTimes) return;

          let openingHour = Number(matchTimes[1]);
          if (openingHour < 12 && matchTimes[2] === 'pm') {
            openingHour += 12;
          }
          let closingHour = Number(matchTimes[3]);
          if (closingHour < 12 && matchTimes[4] === 'pm') {
            closingHour += 12;
          }

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

module.exports = AltonTowers;
