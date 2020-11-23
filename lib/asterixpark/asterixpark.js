// include core Park class
const Moment = require('moment-timezone');
const Park = require('../park');
const Location = require('../location');

const sApiBase = Symbol('Asterix Park API Base URL');
const sApiVersion = Symbol('Asterix Park API Version');
const sAppVersion = Symbol('Asterix Park App Version');

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
    this[sApiBase] = options.apiBase || 'https://www.parcasterix.fr/webservices/';
    this[sApiVersion] = options.apiVersion || '1';
    this[sAppVersion] = options.appVersion || '320';
  }

  /* eslint-disable class-methods-use-this */
  // this park supports ride schedules
  get SupportsRideSchedules() {
    return true;
  }
  /* eslint-enable class-methods-use-this */

  GetRideData() {
    // cache locally for a week
    return this.Cache.Wrap('ridedata', this.FetchRideData.bind(this), 60 * 60 * 24 * 7);
  }

  FetchRideData() {
    return this.HTTP({
      url: `${this[sApiBase]}api/attractions.json`,
      data: {
        device: 'android',
        version: this[sAppVersion],
        lang: 'fr',
        apiversion: this[sApiVersion],
      },
      mock: 'ParcAsterixRideData',
    }).then((rideResp) => {
      const returnData = {};

      rideResp.result.attractions.forEach((ride) => {
        returnData[ride.code] = {
          name: ride.title,
          location: new Location({
            name: `Asteric Park Ride - ${ride.title}`,
            latitude: ride.latitude,
            longitude: ride.longitude,
            timezone: this.Timezone,
          }),
        };
      });

      return Promise.resolve(returnData);
    });
  }

  FetchWaitTimes() {
    return this.GetRideData().then(rideData => this.HTTP({
      url: `${this[sApiBase]}api/attentix.json`,
      data: {
        device: 'android',
        version: this[sAppVersion],
        lang: 'fr',
        apiversion: this[sApiVersion],
      },
      mock: 'ParcAsterixWaitTimes',
    }).then(waittimes => this.GetOpeningTimes().then((parkTimes) => {
      let allRidesClosed = true;
      let todaysOpeningHour;

      const now = Moment();
      parkTimes.forEach((parkTime) => {
        if (parkTime.type === 'Operating' && now.isBetween(parkTime.openingTime, parkTime.closingTime)) {
          allRidesClosed = false;
          // remember the park's opening hour so we can fill in ride opening times later
          todaysOpeningHour = parkTime.openingTime;
        }
      });

      if (!waittimes.latency || !waittimes.latency.latency) {
        return Promise.reject(new Error("API didn't return expected format"));
      }

      waittimes.latency.latency.forEach((ridetime) => {
        // skip if we haven't got any ride data
        if (!rideData[ridetime.attractionid] || !rideData[ridetime.attractionid].name) {
          return;
        }

        const rideUpdateData = {
          // ride name comes from hard-coded AsterixData.json file
          name: rideData[ridetime.attractionid].name,
          waitTime: -1,
          meta: {},
        };

        // add ride location if available
        if (rideData[ridetime.attractionid] && rideData[ridetime.attractionid].location) {
          rideUpdateData.meta.location = rideData[ridetime.attractionid].location.LocationString;
          rideUpdateData.meta.longitude = rideData[ridetime.attractionid].location.LongitudeRaw || undefined;
          rideUpdateData.meta.latitude = rideData[ridetime.attractionid].location.LatitudeRaw || undefined;
        }

        // if park is closed, just mark all rides as closed
        if (!allRidesClosed) {
          // FYI, latency = "A L'ARRET" / "INDISPONIBLE" / "FERME" / "X" (mn)
          if (ridetime.latency === "A L'ARRET" || ridetime.latency === 'INDISPONIBLE') {
            rideUpdateData.waitTime = -2;
          } else if (ridetime.latency === 'FERME') {
            rideUpdateData.waitTime = -1;
          } else {
            rideUpdateData.waitTime = parseInt(ridetime.latency, 10) || null;

            // add ride opening/closing time meta data (if available)
            if (ridetime.closing_time) {
              const resultRe = reClosingTime.exec(ridetime.closing_time);
              if (resultRe) {
                const closingMoment = Moment.tz(this.Timezone).hours(parseInt(resultRe[1], 10)).minutes(parseInt(resultRe[2], 10)).seconds(0);
                rideUpdateData.meta.rideOpeningTime = todaysOpeningHour;
                rideUpdateData.meta.rideClosingTime = closingMoment.format();
              }
            }
          }
        }

        this.UpdateRide(ridetime.attractionid, rideUpdateData);
      });

      return Promise.resolve();
    })));
  }

  FetchOpeningTimes() {
    return this.HTTP({
      url: `${this[sApiBase]}03/fr`,
      data: {
        device: 'android',
        version: this[sAppVersion],
        lang: 'fr',
        apiversion: this[sApiVersion],
      },
      mock: 'ParcAsterixOpeningHours',
    }).then((openingHours) => {
      if (!openingHours.agenda) {
        return Promise.reject(new Error("API didn't return expected opening hours data"));
      }
      openingHours.agenda.forEach((agenda) => {
        const date = Moment.tz(agenda.jour, 'DD-MM-YYYY', this.Timezone);

        if (agenda.type === 'D') {
          // park is closed
          this.Schedule.SetDate({
            date,
            type: 'Closed',
          });
        } else {
          // test for weird times with human text
          reHumanTime.lastIndex = 0;
          const match = reHumanTime.exec(agenda.horaire);
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
            while ((resultRe = reTime.exec(agenda.horaire)) !== null) {
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
