// include core Park class
const Moment = require('moment-timezone');
const Park = require('../park');
const Location = require('../location');

const sApiBase = Symbol('Asterix Park API Base URL');

const reTime = /(\d+)h - (\d+|Minuit)(?:h?)/ig;
const reHumanTime = /(\d+)h - fermeture à partir de (\d+)h/ig;
const reClosingTime = /(\d+)h(\d+)/;

/**
 * Implements the Asterix Park API
 * @class
 * @extends Park
 */
class AsterixPark extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Parc-Asterix';
    options.timezone = options.timezone || 'Europe/Paris';
    options.latitude = options.latitude || 49.136041;
    options.longitude = options.longitude || 2.572768;

    // inherit from base class
    super(options);

    // API Options
    this[sApiBase] = options.apiBase || 'https://api.middleware.parcasterix.fr/graphql';
  }

  /* eslint-disable class-methods-use-this */
  // this park supports ride schedules
  get SupportsRideSchedules() {
    return true;
  }
  /* eslint-enable class-methods-use-this */

  FetchWaitTimes() {
    return this.HTTP({
      url: this[sApiBase],
      method: 'post',
      data: {
        query: 'query{\n  attractions(localeFilters: {locale: "fr"}){\n    drupalId\n    latency {\n#       drupalId\n      latency\n      closingTime\n      createdAt\n      updatedAt\n    } \n    title\n    latitude\n    longitude\n  }\n}',
        variables: {},
      },
      mock: 'ParcAsterixWaitTimes',
    }).then((waittimes) => {
      let todaysOpeningHour;

      if (!waittimes.data || !waittimes.data.attractions) {
        return Promise.reject(new Error("API didn't return expected format"));
      }

      waittimes.data.attractions.forEach((attraction) => {
        const rideUpdateData = {
          name: attraction.title,
          meta: {
            latitude: attraction.latitude,
            longitude: attraction.longitude,
          },
          waitTime: -1,
        };

        if (attraction.latency) {
          // FYI, latency = "A L'ARRET" / "INDISPONIBLE" / "FERME" / "X" (mn)
          if (attraction.latency.latency === "A L'ARRET" || attraction.latency.latency === 'INDISPONIBLE') {
            rideUpdateData.waitTime = -2;
          } else if (attraction.latency.latency === 'FERME') {
            rideUpdateData.waitTime = -1;
          } else {
            rideUpdateData.waitTime = parseInt(attraction.latency.latency, 10) || null;
          }

          // add ride opening/closing time meta data (if available)
          if (attraction.latency.closingTime) {
            const resultRe = reClosingTime.exec(attraction.latency.closingTime);
            if (resultRe) {
              const closingMoment = Moment.tz(this.Timezone).hours(parseInt(resultRe[1], 10)).minutes(parseInt(resultRe[2], 10)).seconds(0);
              rideUpdateData.meta.rideOpeningTime = todaysOpeningHour;
              rideUpdateData.meta.rideClosingTime = closingMoment.format();
            }
          }
        }

        this.UpdateRide(attraction.drupalId, rideUpdateData);
      });

      return Promise.resolve();
    });
  }

  FetchOpeningTimes() {
    return this.HTTP({
      url: this[sApiBase],
      method: 'post',
      data: {
        query: '\nquery{\n  calendar{\n    id\n    day\n    times\n    type\n    createdAt\n    updatedAt\n  }\n}',
        variables: {},
      },
      mock: 'ParcAsterixOpeningHours',
    }).then((openingHours) => {
      if (!openingHours.data || !openingHours.data.calendar) {
        return Promise.reject(new Error("API didn't return expected opening hours data"));
      }
      openingHours.data.calendar.forEach((agenda) => {
        const date = Moment.tz(agenda.day, 'YYYY-MM-DD', this.Timezone);

        if (agenda.type === 'D') { // TODO : not used anymode ?
          // park is closed
          this.Schedule.SetDate({
            date,
            type: 'Closed',
          });
        } else {
          // TODO : not used anymode ?
          // test for weird times with human text
          reHumanTime.lastIndex = 0;
          const match = reHumanTime.exec(agenda.times);
          if (match !== null) {
            this.Schedule.SetDate({
              date,
              openingTime: date.clone().hours(parseInt(match[1], 10)).minutes(0).seconds(0),
              closingTime: date.clone().hours(parseInt(match[2], 10)).minutes(0).seconds(0),
              type: 'Operating',
            });
          } else {
            // otherwise parse out simple times
            let resultRe;
            let firstResult = true;
            reTime.lastIndex = 0;

            /* eslint-disable no-cond-assign */
            while ((resultRe = reTime.exec(agenda.times)) !== null) {
              // - Normal time
              this.Schedule.SetDate({
                date,
                openingTime: date.clone().hours(parseInt(resultRe[1], 10)).minutes(0).seconds(0),
                closingTime: (resultRe[2] === 'Minuit') ? date.endOf('day') : date.clone().hours(parseInt(resultRe[2], 10)).minutes(0).seconds(0),
                // can't send type for "special hours"
                type: !firstResult ? null : 'Operating',
                // first result is normal hours, any further dates are special hours
                specialHours: !firstResult,
              });

              // mark that we've parsed one set of opening hours, assume any others are special
              firstResult = false;
            }
          }
          /* eslint-enable no-cond-assign */
        }
      });

      return Promise.resolve();
    });
  }
}

// export the class
module.exports = AsterixPark;
