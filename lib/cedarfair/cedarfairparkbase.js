// Uses "The Experience Engine" framework for their wait times
const Moment = require('moment-timezone');

// a lenient JSON parser
const relaxedJson = require('relaxed-json');
const TE2Park = require('./te2parkbase');

// cedar parks have special hours under unique categories
//  example: scary farm is listed as a separate park_id
// so we need to list these here so we can combine them into our schedule data as "special hours"
const sSpecialHours = Symbol('Special Hours key name');

// move this outside the class as it's just a convenience class and doens't need to be exposed
const regexLegendTimes = /([0-9]+(?::[0-9]+)?[ap]m)\s*-\s*([0-9]+(?::[0-9]+)?[ap]m)/i;

function ParseOpeningLegend(legendData) {
  const schedule = {};

  // legends are inside two loops. Not totally sure why, but might be a lazy formatting choice for the HTML result
  legendData.forEach((legendA) => {
    legendA.forEach((legend) => {
      // try to parse times out of description
      const times = regexLegendTimes.exec(legend.description);
      if (times && times[1] && times[2]) {
        schedule[legend.class] = {
          openingTime: Moment(`${times[1].toUpperCase()}`, 'H:mA'),
          closingTime: Moment(`${times[2].toUpperCase()}`, 'H:mA'),
        };
      }
    });
  });

  return schedule;
}

/**
 * Implements the CedarFairPark API framework.
 * @class
 * @extends SeaWorld
 */
class CedarFairPark extends TE2Park {
  /**
   * Create new CedarFairPark Object.
   * This object should not be called directly, but rather extended for each of the individual Cedar Fair parks
   * @param {Object} options
   * @param {String} options.park_id ID of the park to access the API for
   * @param {String} [options.auth_token] Auth token to use to connect to the API
   * @param {String} [options.api_base] Base URL to access the API
   * @param {String[]} [options.ride_types] Array of types that denote rides at the park (to avoid listing restaurants/toilets etc. as rides)
   * @param {String[]} [options.special_hours] Array of park IDs to combine with main park for special hours (eg. scaryfarm)
   */
  constructor(options = {}) {
    options.name = options.name || 'Cedar Fair Park';

    // change defaults before calling super()
    options.auth_token = options.auth_token || 'Mobile_API:merl4yU2';
    options.api_base = options.api_base || 'https://cf.te2.biz/rest/';

    // inherit from base class
    super(options);

    // optional special hour parks
    this[sSpecialHours] = options.special_hours || [];
    // make sure we're an array
    this[sSpecialHours] = [].concat(this[sSpecialHours]);
  }

  // sadly, the Cedar Fair API doesn't have park hours (it just returns an empty array)
  //  so, let's override it from SeaWorld
  FindScheduleDataURL() {
    return this.Cache.Wrap('schedule_url', () => this.GetAPIUrl({
      // the park hours URL is kept in the products area
      url: `${this.APIBase}commerce/${this.ParkID}/products/all`,
    }).then((productData) => {
      // got product data, we're looking for GUEST_PARK_HOURS to get our schedule URL
      const productDataURL = productData.find(product => (product.id === 'GUEST_PARK_HOURS' && product.purchaseLink.indexOf('park-hours') >= 0));

      if (productDataURL !== undefined) {
        return Promise.resolve(`${productDataURL.purchaseLink.replace(/park-hours[a-zA-Z0-9_-]*\.htm/, '')}js/schedule.js`);
      }

      // failed? search the main venue data instead
      return this.GetAPIUrl({
        url: `${this.APIBase}venue/${this.ParkID}`,
      }).then((venueData) => {
        // search venue data
        if (venueData.details) {
          const detail = venueData.details.find(venueDetail => (venueDetail.id === 'info_web_hours_directions' && venueDetail.description.indexOf('park-hours') >= 0));

          if (detail !== undefined) {
            return Promise.resolve(`${detail.description.replace(/park-hours[a-zA-Z0-9_-]*\.htm/, '')}js/schedule.js`);
          }
          return Promise.reject(new Error('Park hours URL has changed, requires themeparks library update'));
        }

        return Promise.reject(new Error('Unabel to find schedule data URL'));
      });
    }), 60 * 60 * 24); // cache URL for 24 hours
  }

  FetchStaticScheduleData() {
    return this.Cache.Wrap('schedule_data', () => this.FindScheduleDataURL().then(scheduleURL => this.HTTP({
      // notice we don't use the API here, this is hosted outside the API, so do a normal API request
      url: scheduleURL,
    }).then((scheduleData) => {
      let data = scheduleData.toString();
      // strip out data around the key JSON object
      //  this isn't pretty, but avoids having to manually embed this data into the library, which would be worse

      // remove js var init
      data = data.replace(/var\s+schedule\s*=\s*/, '');

      // remove semi-colon
      data = data.replace(/;/g, '');

      // remove leading non-{ characters
      data = data.replace(/^[^{]+/, '');

      // remove any extra variables after initial one
      data = data.replace(/var[\S\s]*$/mg, '');

      // use our lenient JSON parser
      let JSONData = null;
      try {
        JSONData = relaxedJson.parse(data);
      } catch (e) {
        return Promise.reject(new Error(`Failed to parse response data from ${this.Name} API: ${e}`));
      }

      if (JSONData) {
        return Promise.resolve(JSONData);
      }
      return Promise.reject(new Error(`Failed to get JSON data from ${this.name} API`));
    })), 60 * 60 * 24); // cache for 24 hours
  }

  FetchOpeningTimes() {
    // get our schedule data
    return this.FetchStaticScheduleData().then((scheduleData) => {
      if (!scheduleData || !scheduleData.main) {
        return Promise.reject(new Error('Unable to find main schedule data for park'));
      }

      // parse park legend to figure out possible opening hours
      const mainParkHours = ParseOpeningLegend(scheduleData.main.legend);

      let today;

      // cycle through main park hours
      scheduleData.main.months.forEach((month) => {
        month.hours.forEach((dayRow) => {
          dayRow.forEach((day) => {
            // skip this entry if there is no day set
            if (!day.day) return;
            // skip this entry if the class doesn't appear in the legend
            if (!mainParkHours[day.class]) return;

            // figure out this day in the local timezone
            today = Moment.tz({
              day: day.day,
              month: month.index,
              year: month.year,
            }, this.Timezone);

            this.Schedule.SetDate({
              date: today,
              // clone today and overwrite the hours from the park legend
              openingTime: today.clone().set('hours', mainParkHours[day.class].openingTime.get('hours')).set('minutes', mainParkHours[day.class].openingTime.get('minutes')),
              closingTime: today.clone().set('hours', mainParkHours[day.class].closingTime.get('hours')).set('minutes', mainParkHours[day.class].closingTime.get('minutes')),
              type: 'Operating',
            });
          });
        });
      });

      // if we have special hours, inject these into main hours
      this[sSpecialHours].forEach((specialHours) => {
        if (!scheduleData[specialHours]) return;

        const specialLegend = ParseOpeningLegend(scheduleData[specialHours].legend);

        scheduleData[specialHours].months.forEach((month) => {
          month.hours.forEach((dayRow) => {
            dayRow.forEach((day) => {
              // skip this entry if there is no day set
              if (!day.day) return;
              // skip this entry if the class doesn't appear in the legend
              if (!specialLegend[day.class]) return;

              // figure out this day in the local timezone
              today = Moment.tz({
                day: day.day,
                month: month.index,
                year: month.year,
              }, this.Timezone);

              this.Schedule.SetDate({
                date: today,
                // clone today and overwrite the hours from the park legend
                openingTime: today.clone().set('hours', specialLegend[day.class].openingTime.get('hours')).set('minutes', specialLegend[day.class].openingTime.get('minutes')),
                closingTime: today.clone().set('hours', specialLegend[day.class].closingTime.get('hours')).set('minutes', specialLegend[day.class].closingTime.get('minutes')),
                type: specialHours,
                specialHours: true,
              });
            });
          });
        });
      });

      return Promise.resolve();
    });
  }
}

module.exports = CedarFairPark;
