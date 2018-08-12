/**
 * Base park for resorts that aren't fully using the new Disney API yet
 * Some parks (Paris, Hong Kong, Shanghai) use the live API for wait times
 *  but not for actaul facility data (yet?)
 */

const DisneyAPIBase = require('./disneyworldapibase');
const DisneyUtil = require('./disneyUtil');
const Location = require('../location');

class DisneyLegacyPark extends DisneyAPIBase {
  constructor(options = {}) {
    // stop the facility channel from being created
    //  the facility channel is the main bit missing from the non US Disney parks
    //  offline_facilities just stops the facility channel from starting up
    options.offlineFacilities = options.offlineFacilities !== undefined ? options.offlineFacilities : true;

    super(options);
  }

  // override facility data fetching
  GetFacilityNames(facilityIDs) {
    return this.GetFacilitiesData().then((facilityData) => {
      // extract just the ride names from the facility data
      const rideNames = {};

      // clean up facility IDs we want
      const cleanIDs = facilityIDs.map(DisneyUtil.CleanID);

      Object.keys(facilityData).forEach((facilityID) => {
        // make sure we only include rides in the correct park and for rides we've requested
        if (facilityData[facilityID].park === this.GetParkID && cleanIDs.indexOf(facilityID) >= 0) {
          rideNames[facilityID] = facilityData[facilityID].name;
        }
      });

      return Promise.resolve(rideNames);
    });
  }

  get FetchFacilitiesURL() {
    return `${this.GetAPIBase}mobile-service/public/destinations/${this.GetResortID};entityType\u003ddestination/facilities?region=${this.GetResortRegion}`;
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

  FetchFacilitiesData() {
    return this.GetAPIUrl({
      url: this.FetchFacilitiesURL,
      method: 'POST',
    }).then((data) => {
      const facilitiesData = {};

      data.added.forEach((element) => {
        if (element.type !== 'Attraction') return;

        // figure out the park ID
        const themeParkElement = element.ancestors.find(x => x.type === 'theme-park');
        const parkID = themeParkElement !== undefined ? DisneyUtil.CleanID(themeParkElement.id) : undefined;

        // grab ride coordinates (there will be likely multiple)
        const rideCoordinates = [];
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
          fastPass,
          park: parkID,
        };
      });

      return Promise.resolve(facilitiesData);
    });
  }
}

module.exports = DisneyLegacyPark;
