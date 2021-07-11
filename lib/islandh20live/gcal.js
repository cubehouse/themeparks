// basic gcal API fetcher for Wix calendars
//  built for H20 Live park API
const needle = require('needle');
const Moment = require('moment');
const cache = require('../cache');

const sCalendarID = Symbol('Calendar ID for Caching');
const sCompId = Symbol('Wix Comp ID');
const sWixBaseURL = Symbol('Wix Base URL');
const sTimezone = Symbol('Timezone of calendar');
const sCalendarURL = Symbol('Calendar Wix Page URL');

function StringMatchesToHourMinutes(Hours, Minutes, APM) {
  // switch to 24-hour clock
  let H = parseInt(Hours, 10);
  if (APM.toLowerCase() === 'pm' && H <= 12) {
    H += 12;
  }
  const M = Minutes === undefined ? 0 : parseInt(Minutes, 10);

  return `${H < 10 ? '0' : ''}${H}:${M < 10 ? '0' : ''}${M}:00`;
}

class WixGCal {
  constructor(options) {
    if (!options.compId) throw new Error('Missing compId for Wix GCal calendar');
    this[sCompId] = options.compId;

    this[sWixBaseURL] = options.wixBaseURL || 'https://google-calendar.galilcloud.wixapps.net/';

    if (!options.id) throw new Error('Missing unique calendar ID for caching');
    this[sCalendarID] = options.id;

    if (!options.timezone) throw new Error('Missing calendar timezone');
    this[sTimezone] = options.timezone;

    this[sCalendarURL] = options.calendarURL || undefined;
  }

  FetchWixCalendarInstanceID() {
    return needle('GET', this[sCalendarURL]).then((resp) => {
      const regexSearchForInstanceID = /google-calendar\.galilcloud\.wixapps\.net[^"]+instance=([^&]+)/m;
      const match = regexSearchForInstanceID.exec(resp.body);
      if (!match) {
        return Promise.reject(new Error(`Failed to find Wix calendar ID in url ${this[sCalendarURL]}`));
      }

      return Promise.resolve(match[1]);
    });
  }

  /**
   * Parse a Wix calendar page for the GCals API key to use for our calendar
   */
  FetchGCalAPIKey() {
    return cache.WrapGlobal(`wixGCalAPIKey_${this[sCalendarID]}`, () => {
      return this.FetchWixCalendarInstanceID().then((instanceID) => {
        return needle('GET', `${this[sWixBaseURL]}`, {
          compId: this[sCompId],
          instance: instanceID,
        }, {
          headers: {
            referer: this[sCalendarURL],
          },
        }).then((HTMLBody) => {
          const apiKeyMatch = /GOOGLE_CALENDAR_API_KEY"\s*:\s*"([^"]+)"/.exec(HTMLBody.body);
          if (apiKeyMatch) {
            return Promise.resolve(apiKeyMatch[1]);
          }
          return Promise.resolve(undefined);
        });
      });
    }, 60 * 60 * 24); // cache key for 24 hours
  }

  GetEvents(start, end) {
    return this.FetchGCalAPIKey().then((apiKey) => {
      return needle('GET', 'https://www.googleapis.com/calendar/v3/calendars/arcadetracker.com_9oj2tjeqnportmc6trgf7iqei4%40group.calendar.google.com/events', {
        orderBy: 'startTime',
        key: apiKey,
        timeMin: `${start}T00:00:00+00:00`,
        timeMax: `${end}T00:00:00+00:00`,
        singleEvents: true,
        maxResults: 9999,
      }).then((resp) => {
        const calendar = [];

        resp.body.items.forEach((item) => {
          // skip unknown item types
          if (item.kind !== 'calendar#event') return;

          if (!item.start || !item.end) {
            return;
          }

          // skip closed days
          if (item.summary.toLowerCase().indexOf('closed') >= 0) return;

          const date = item.start.date ? Moment(item.start.date, 'YYYY-MM-DD') : Moment(item.start.dateTime.slice(0, 10), 'YYYY-MM-DD');

          const CalendarEntry = {
            date,
          };

          // TODO - some dates have *3* different opening times
          //  eg. 26th October
          //  handle this properly and figure out the correct actual time and what is a special event

          if (item.start.dateTime) {
            CalendarEntry.openingTime = Moment.tz(item.start.dateTime, 'YYYY-MM-DDTHH:mm:ssz', this[sTimezone]);
            CalendarEntry.closingTime = Moment.tz(item.end.dateTime, 'YYYY-MM-DDTHH:mm:ssz', this[sTimezone]);

            CalendarEntry.specialHours = !(item.summary.indexOf('Current S') >= 0);
            CalendarEntry.type = CalendarEntry.specialHours ? item.summary : 'Operating';
          } else {
            // search for times
            const timesMatch = /(\d{1,2})(?::(\d{2}))?\s*([ap]m)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*([ap]m)/.exec(item.summary);
            if (timesMatch) {
              CalendarEntry.openingTime = Moment.tz(`${CalendarEntry.date.format('YYYY-MM-DD')}T${StringMatchesToHourMinutes(timesMatch[1], timesMatch[2], timesMatch[3])}`, 'YYYY-MM-DDTHH:mm:ssz', this[sTimezone]);
              // don't worry about whether the event goes over into the next day, the schedule lib will handle this for us
              CalendarEntry.closingTime = Moment.tz(`${CalendarEntry.date.format('YYYY-MM-DD')}T${StringMatchesToHourMinutes(timesMatch[4], timesMatch[5], timesMatch[6])}`, 'YYYY-MM-DDTHH:mm:ssz', this[sTimezone]);
              CalendarEntry.type = 'Operating';
            }
          }

          calendar.push(CalendarEntry);
        });

        return Promise.resolve(calendar);
      });
    });
  }
}

module.exports = WixGCal;

if (!module.parent) {
  const C = new WixGCal({
    id: 'h20live',
    compId: 'comp-jw7w0e57',
    timezone: 'America/New_York',
    calendarURL: 'https://www.islandh2olive.com/operating-calendar',
  });

  C.GetEvents('2019-10-20', '2019-12-20').then(console.log);
}
