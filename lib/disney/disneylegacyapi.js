/**
 * Base park for resorts that aren't fully using the new Disney API yet
 * Some parks (Paris, Hong Kong, Shanghai) use the live API for wait times
 *  but not for actaul facility data (yet?)
 */

const Moment = require('moment-timezone');
const DisneyAPIBase = require('./disneyworldapibase');
const DisneyUtil = require('./disneyUtil');
const Location = require('../location');

class DisneyLegacyPark extends DisneyAPIBase {
  constructor(options = {}) {
    super(options);
  }

  // override facility data fetching
  GetFacilityData(facilityIDs) {
    return this.GetFacilitiesData().then((facilityData) => {
      // extract just the ride names from the facility data
      const rideNames = {};

      // clean up facility IDs we want
      const cleanIDs = facilityIDs.map(DisneyUtil.CleanID);

      Object.keys(facilityData).forEach((facilityID) => {
        // make sure we only include rides in the correct park and for rides we've requested
        if (facilityData[facilityID].park === this.GetParkID && cleanIDs.indexOf(facilityID) >= 0) {
          rideNames[facilityID] = {
            name: facilityData[facilityID].name,
            fastpass: facilityData[facilityID].fastPass,
            singleRider: facilityData[facilityID].singleRider,
            photoPass: facilityData[facilityID].photoPass,
            longitude: facilityData[facilityID].longitude,
            latitude: facilityData[facilityID].latitude,
          };
        }
      });

      return Promise.resolve(rideNames);
    });
  }

  get FetchFacilitiesURL() {
    return `${this.GetAPIBase}explorer-service/public/destinations/${this.GetResortID};entityType\u003ddestination/facilities?region=${this.GetResortRegion}`;
  }

  /**
   * Get park facilities data
   * Gives us data like whether a ride offers FastPass and their geo-location
   */
  GetFacilitiesData() {
    // cache facilities data for 24 hours (this fetches all data for the resort, so cache at a resort level with a global wrap)
    return this.Cache.Wrap(
      `${this.GetResortCode}_legacyfacilities`,
      this.FetchFacilitiesData.bind(this),
      60 * 60 * 24 // re-fetch every 24 hours
    );
  }

  ParseFacilitiesUpdate(data) {
    const facilitiesData = {};

    const updateEntry = (element) => {
      if (element.type !== 'Attraction') return;

      // figure out the park ID
      const themeParkElement = element.ancestors.find(x => x.type === 'theme-park');
      const parkID = themeParkElement !== undefined ? DisneyUtil.CleanID(themeParkElement.id) : undefined;

      // grab ride coordinates (there will be likely multiple)
      const rideCoordinates = [];
      let longitude;
      let latitude;
      element.relatedLocations.forEach((loc) => {
        loc.coordinates.forEach((coordinate) => {
          // each ride can have multiple locations
          //  think: railway, fastPass entrance etc.

          let locationName = coordinate.type.trim();

          // calculate name for this location
          if (locationName === 'Guest Entrance') {
            // we have a "Guest Entrance", rather than calling it that, use the name of this location
            //  this helps for rides with multiple "Guest Entrance"s like the railroad
            locationName = loc.name.trim();

            // eslint-disable-next-line prefer-destructuring
            longitude = Number(coordinate.longitude);
            // eslint-disable-next-line prefer-destructuring
            latitude = Number(coordinate.latitude);
          }

          rideCoordinates.push(new Location({
            name: locationName,
            longitude: coordinate.longitude,
            latitude: coordinate.latitude,
            timezone: this.Timezone,
          }));
        });
      });

      // figure out if we have fastPass for this ride (it's sometimes called fastPassPlus?!)
      let fastPass = false;
      if (element.fastPass !== undefined && element.fastPass === 'true') {
        fastPass = true;
      } else if (element.fastPassPlus !== undefined && element.fastPassPlus === 'true') {
        fastPass = true;
      }

      // store ride name, location, and fastPass presence
      facilitiesData[DisneyUtil.CleanID(element.id)] = {
        name: element.name.trim(),
        locations: rideCoordinates,
        longitude,
        latitude,
        fastPass,
        park: parkID,
        singleRider: element.facets.find(x => x.id === 'service-single-rider') !== undefined,
        photoPass: element.facets.find(x => x.id === 'photopass') !== undefined,
      };
    };

    data.added.forEach(updateEntry);
    data.updated.forEach(updateEntry);

    return Promise.resolve(facilitiesData);
  }

  FetchFacilitiesData() {
    return this.GetAPIUrl({
      url: this.FetchFacilitiesURL,
      method: 'POST',
    }).then(this.ParseFacilitiesUpdate.bind(this));
  }

  FetchOpeningTimes() {
    const today = Moment().tz(this.Timezone);
    const scheduleEnd = today.clone().add(this.GetNumScheduleDays, 'days');

    return this.GetAPIUrl({
      url: `${this.GetAPIBase}explorer-service/public/ancestor-activities-schedules/${this.GetResortCode};entityType=destination`,
      data: {
        filters: 'theme-park,water-park',
        startDate: today.format('YYYY-MM-DD'),
        endDate: scheduleEnd.format('YYYY-MM-DD'),
        region: this.GetResortRegion,
      },
      method: 'GET',
    }).then((data) => {
      const parkOpeningHours = data.activities.find(act => DisneyUtil.CleanID(act.id) === this.GetParkID);

      if (!parkOpeningHours) {
        return Promise.reject(new Error(`Unable to find park operating hours for ${this.GetParkID}`));
      }

      const timezoneToUse = parkOpeningHours.schedule.timeZone;

      parkOpeningHours.schedule.schedules.forEach((sched) => {
        this.Schedule.SetDate({
          date: Moment.tz(sched.date, 'YYYY-MM-DD', timezoneToUse),
          openingTime: Moment.tz(sched.startTime, 'HH:mm:ss', timezoneToUse),
          closingTime: Moment.tz(sched.endTime, 'HH:mm:ss', timezoneToUse),
          type: sched.type,
          specialHours: sched.type !== 'Operating',
        });
      });

      return Promise.resolve();
    });
  }
}

module.exports = DisneyLegacyPark;
