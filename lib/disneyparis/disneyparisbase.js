const uuid = require('uuid');
const Moment = require('moment-timezone');

const Park = require('../park');
const Cache = require('../cache');

const sApiBase = Symbol('API Base URL');
const sApiWaitTimes = Symbol('API Base URL for Wait Times');
const sApiKey = Symbol('API Key for Wait Times Service');
const sParkID = Symbol('Park ID for this Disneyland Paris Park');

/**
 * Implements the Disneyland Paris API framework.
 * @class
 * @extends Park
 */
class DisneyParisPark extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Disneyland Paris Park';
    options.timezone = options.timezone || 'Europe/Paris';

    options.useragent = options.useragent || 'okhttp/3.12.1';

    super(options);

    this[sApiBase] = options.apiBase || 'https://api.disneylandparis.com';
    this[sApiWaitTimes] = options.apiBaseWaitTimes || 'https://dlp-wt.wdprapps.disney.com/prod/v1/';
    this[sApiKey] = options.apiKey || '3jPT5qMimN3kR2kxqd1ez9iF1C68CrBf7zw5ICo4';

    if (!options.parkId) throw new Error('Missing parkId');
    this[sParkID] = options.parkId;
  }

  /** Fetch park data from the API. Returns Object of RideID => Data (things like name, status, opening hours etc.) */
  FetchParkData() {
    // we need to pass in today's date to get daily ride updates and schedules
    const today = Moment().tz(this.Timezone).format('YYYY-MM-DD');

    // fetch both parks data at once
    return this.HTTP({
      url: `${this[sApiBase]}/query`,
      method: 'POST',
      data: {
        query: 'query activitySchedules($market: String!, $types: [ActivityScheduleStatusInput]!, $date: String!) { activitySchedules(market: $market, date: $date, types: $types) { id name location { ...location } type schedules(date: $date, types: $types) { startTime endTime date status closed } } } fragment location on Location { id }',
        variables: {
          market: 'en-gb',
          types: [{
            type: 'Attraction',
            status: ['OPERATING', 'REFURBISHMENT', 'CLOSED'],
          }],
          date: today,
        },
      },
      headers: {
        'x-application-id': 'mobile-app',
        'x-request-id': uuid(),
      },
      json: true,
    }).then((data) => {
      const Attractions = {};

      // format returned data into something cleaner
      data.data.activitySchedules.forEach((activity) => {
        const Attraction = {
          id: activity.id,
          name: activity.name,
          park: activity.location ? activity.location.id : null,
          active: true,
        };

        // store opening/closing hours if available
        if (activity.schedules && activity.schedules[0]) {
          const openingData = activity.schedules[0];

          Attraction.status = openingData.status;
          Attraction.active = !openingData.closed;

          if (openingData.status === 'OPERATING') {
            Attraction.openingTime = activity.schedules[0].startTime;
            Attraction.closingTime = activity.schedules[0].endTime;
          }
        }

        Attractions[activity.id] = Attraction;
      });

      return Promise.resolve(Attractions);
    });
  }

  GetParkData() {
    // wrap this for both Disney Paris parks
    return Cache.WrapGlobal('dlp_ridedata', this.FetchParkData.bind(this), 60 * 60 * 4); // fetch once every 4 hours
  }

  /** Get Park Wait Times */
  INTERNALFetchWaitTimes() {
    // get park data (ride names etc.) first
    return this.GetParkData().then((parkData) => {
      // then fetch live ride times
      return this.HTTP({
        url: `${this[sApiWaitTimes]}waitTimes`,
        headers: {
          'x-api-key': this[sApiKey],
          accept: 'application/json, text/plain, */*',
        },
      }).then((times) => {
        const waitTimeObjects = [];

        // parse wait times
        times.forEach((time) => {
          const rideData = parkData[time.entityId] || {};

          const RideUpdateObject = {
            name: rideData.name || '???',
            meta: {},
          };

          // figure out wait time
          if (time.status === 'OPERATING') {
            RideUpdateObject.waitTime = parseInt(time.postedWaitMinutes || 0, 10) || 0;
          } else if (time.status === 'DOWN') {
            RideUpdateObject.waitTime = -2;
          } else if (rideData.active !== undefined && !rideData.active) {
            // use ride data to determine if ride is under refurb or closed
            if (rideData.status === 'REFURBISHMENT') {
              RideUpdateObject.waitTime = -3; // refurb
            } else if (rideData.status === 'CLOSED') {
              RideUpdateObject.waitTime = -1; // closed
            }
          } else {
            // unknown status, assume closed
            RideUpdateObject.waitTime = -1;
          }

          // add opening/closing times (if available)
          if (rideData.openingTime && rideData.closingTime) {
            RideUpdateObject.meta.openingTime = rideData.openingTime;
            RideUpdateObject.meta.closingTime = rideData.closingTime;
          }

          // add single ride status (if available)
          if (time.singleRider && time.singleRider.isAvailable) {
            RideUpdateObject.meta.singleRider = true;
            RideUpdateObject.meta.singleRiderWaitTime = parseInt(time.singleRider.singleRiderWaitMinutes || 0, 10) || 0;
          } else {
            RideUpdateObject.meta.singleRider = false;
          }

          waitTimeObjects.push({
            id: time.entityId,
            park: time.parkId,
            data: RideUpdateObject,
          });
        });

        return Promise.resolve(waitTimeObjects);
      });
    });
  }

  FetchWaitTimes() {
    // both parks return at the same time, so wrap them in a brief cache (just one minute)
    return Cache.WrapGlobal('dlp_waittimedata', this.INTERNALFetchWaitTimes.bind(this), 60).then((waitTimes) => {
      // filter out times for our park
      const ThisParkID = `0/P/${this[sParkID]}`;

      waitTimes.filter(x => x.park === ThisParkID).forEach((ride) => {
        this.UpdateRide(ride.id, ride.data);
      });

      return Promise.resolve();
    });
  }

  FetchScheduleDate(date) {
    return Cache.WrapGlobal(`dlp_calendar_${date}`, () => {
      return this.HTTP({
        url: `${this[sApiBase]}/query`,
        method: 'POST',
        data: {
          query: 'query activitySchedules($market: String!, $types: [ActivityScheduleStatusInput]!, $date: String!) { activitySchedules(market: $market, date: $date, types: $types) { id name type schedules(date: $date, types: $types) { startTime endTime date status closed } } }',
          variables: {
            market: 'en-gb',
            types: [{
              type: 'ThemePark',
              status: ['OPERATING', 'EXTRA_MAGIC_HOURS'],
            }],
            date,
          },
        },
        headers: {
          'x-application-id': 'mobile-app',
          'x-request-id': uuid(),
        },
        json: true,
      });
    }, 60 * 60 * 24 * 2); // cache each date's data for 2 days
  }

  FetchOpeningTimes() {
    const dates = [];
    const endFillDate = Moment().tz(this.Timezone).add(this.GetNumScheduleDays + 1, 'days');
    for (let m = Moment().tz(this.Timezone).subtract(1, 'days'); m.isBefore(endFillDate); m.add(1, 'day')) {
      dates.push(m.format('YYYY-MM-DD'));
    }

    // process each date into calendar in order
    return dates.reduce((prev, date) => {
      return prev.then(() => {
        return this.FetchScheduleDate(date).then((openingTimes) => {
          openingTimes.data.activitySchedules.forEach((park) => {
            // only parse our park ID
            if (park.id === this[sParkID]) {
              park.schedules.forEach((schedule) => {
                this.Schedule.SetDate({
                  date: Moment.tz(date, 'YYYY-MM-DD', this.Timezone),
                  openingTime: Moment.tz(`${date} ${schedule.startTime}`, 'YYYY-MM-DD HH:mm:ss', this.Timezone),
                  closingTime: Moment.tz(`${date} ${schedule.endTime}`, 'YYYY-MM-DD HH:mm:ss', this.Timezone),
                  type: schedule.status === 'OPERATING' ? 'Operating' : schedule.status.toLowerCase().split('_').map(x => x[0].toUpperCase() + x.slice(1)).join(' '),
                  specialHours: schedule.status !== 'OPERATING',
                });
              });
            }
          });
          return Promise.resolve();
        });
      });
    }, Promise.resolve()).then(() => {
      return Promise.resolve();
    });
  }
}

module.exports = DisneyParisPark;
