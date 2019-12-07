const uuid = require('uuid');
const Moment = require('moment-timezone');

const Park = require('../park');
const Cache = require('../cache');

const sApiBase = Symbol('API Base URL');
const sApiWaitTimes = Symbol('API Base URL for Wait Times');
const sApiKey = Symbol('API Key for Wait Times Service');
const sParkID = Symbol('Park ID for this Disneyland Paris Park');
const sApiLang = Symbol('API Lang for the park');

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
    this[sApiLang] = options.lang || 'en-gb';
  }

  get SupportsRideSchedules() {
    return true;
  }

  /** Fetch park data from the API. Returns Object of RideID => Data (things like name, status, opening hours etc.) */
  FetchParkData() {
    // fetch both parks data at once
    return this.HTTP({
      url: `${this[sApiBase]}/query`,
      method: 'POST',
      data: {
        query: 'query activities($market: String!, $types: [String]) { activities(market: $market, types: $types) { contentType: __typename entityType contentId id name location { ...location } coordinates { ...coordinates } closed schedules { language startTime endTime date status closed } ... on Attraction { age { ...facet } height { ...facet } interests { ...facet } photopass fastPass singleRider } } } fragment facet on Facet { id value urlFriendlyId iconFont } fragment location on Location { id value urlFriendlyId iconFont } fragment coordinates on MapCoordinates { lat lng type } ',
        variables: {
          market: this[sApiLang],
          types: ['Attraction'],
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
      data.data.activities.forEach((activity) => {
        const Attraction = {
          id: activity.id,
          name: activity.name,
          park: activity.location ? activity.location.id : null,
          active: true,
        };

        // find location of entrance
        Attraction.location = (activity.coordinates) ? activity.coordinates.find((x) => {
          return (x.type === 'Guest Entrance' && x.lat !== 0);
        }) : null;

        // does this ride have FastPass?
        Attraction.fastPass = activity.fastPass;
        // photo pass?
        Attraction.photoPass = activity.photopass;
        // single rider?
        Attraction.singleRider = activity.singleRider;

        // store opening/closing hours
        if (activity.schedules && activity.schedules[0]) {
          const openingData = activity.schedules[0];

          Attraction.status = openingData.status;
          Attraction.active = !openingData.closed;

          if (openingData.status === 'OPERATING') {
            Attraction.openingTime = `${activity.schedules[0].date}T${activity.schedules[0].startTime}`;
            Attraction.closingTime = `${activity.schedules[0].date}T${activity.schedules[0].endTime}`;
          }
        } else {
          // ignore this attraction completely if is has no schedule, means a building/area
          return;
        }

        Attractions[activity.id] = Attraction;
      });

      return Promise.resolve(Attractions);
    });
  }

  GetParkData() {
    // wrap this for both Disney Paris parks
    return Cache.WrapGlobal('dlp_ridedata_20191207', this.FetchParkData.bind(this), 60 * 60 * 4); // fetch once every 4 hours
  }

  // DLP has fastpass
  get FastPass() {
    return true;
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

        // parse wait times into object first
        //  when the park is closed, the API now returns no wait times
        //  so we need to loop over all known attractions and try to match to wait times instead
        const timesByKey = {};
        times.forEach((time) => {
          timesByKey[time.entityId] = time;
        });

        Object.keys(parkData).forEach((rideId) => {
          const rideData = parkData[rideId] || {};
          if (!rideData.name) return; // must have a valid name to be returned as a valid ride

          // if we're missing live time data for this ride, build a fake one saying it is closed
          //  API returns no wait times outside of park hours
          const time = timesByKey[rideId] || {
            postedWaitMinutes: 0,
            status: 'CLOSED',
            entityId: rideId,
            parkId: `0/P/${rideData.park}`,
          };

          const RideUpdateObject = {
            name: rideData.name,
            meta: {
              photoPass: rideData.photoPass,
            },
            fastPass: rideData.fastPass,
          };

          if (rideData.location) {
            RideUpdateObject.meta.longitude = rideData.location.lng;
            RideUpdateObject.meta.latitude = rideData.location.lat;
          }

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
            RideUpdateObject.meta.rideOpeningTime = Moment.tz(rideData.openingTime, 'YYYY-MM-DDTHH:mm:ss', this.Timezone).format();
            RideUpdateObject.meta.rideClosingTime = Moment.tz(rideData.closingTime, 'YYYY-MM-DDTHH:mm:ss', this.Timezone).format();
          }

          // add single ride status (if available)
          if (time.singleRider && time.singleRider.isAvailable) {
            RideUpdateObject.meta.singleRider = true;
            RideUpdateObject.meta.singleRiderWaitTime = parseInt(time.singleRider.singleRiderWaitMinutes || 0, 10) || 0;
          } else {
            RideUpdateObject.meta.singleRider = rideData.singleRider;
            RideUpdateObject.meta.singleRiderWaitTime = -1;
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
            market: this[sApiLang],
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
