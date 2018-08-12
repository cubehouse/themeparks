/**
 * Base park for resorts that aren't fully using the new Disney API yet
 * Some parks (Paris, Hong Kong, Shanghai) use the live API for wait times
 *  but not for actaul facility data (yet?)
 */

const DisneyAPIBase = require('./disneyworldapibase');

class DisneyLegacyPark extends DisneyAPIBase {
  constructor(options = {}) {
    super(options);
  }

  // TODO - override facility data fetching?
  GetFacilityNames(facilityIDs) {
    return Promise.resolve({
      1: 'Fake Ride',
    });
  }

  get FetchFacilitiesURL() {
    return `https://api.wdpro.disney.go.com/mobile-service/public/destinations/${this.GetResortID};entityType\u003ddestination/facilities?region=${this.GetResortRegion}`;
  }

  /**
   * Get park facilities data
   * Gives us data like whether a ride offers FastPass and their geo-location
   */
  GetFacilitiesData() {
    // cache facilities data for 24 hours (this fetches all data for the resort, so cache at a resort level with a global wrap)
    return this.Cache.WrapGlobal(`${this.GetResortCode}_legacyfacilities`, () => {
      // fetch fresh facilities data
      return this.GetAPIUrl({
        url: this.FetchFacilitiesURL,
        method: "POST"
      }).then((data) => {
        const facilitiesData = {};

        for (var i = 0, element; element = data.added[i++];) {
          if (element.type != "Attraction") continue;

          // grab ride coordinates (there will be likely multiple)
          var coordinates = [];
          for (var locationIDX = 0, location; location = element.relatedLocations[locationIDX++];) {
            for (var coordinateIDX = 0, coordinate; coordinate = location.coordinates[coordinateIDX++];) {
              // each ride can have multiple locations
              //  think: railway, fastPass entrance etc.

              var locationName = coordinate.type.trim();

              // calculate name for this location
              if (locationName == "Guest Entrance") {
                // we have a "Guest Entrance", rather than calling it that, use the name of this location
                //  this helps for rides with multiple "Guest Entrance"s like the railroad
                locationName = location.name.trim();
              }

              const geoLoc = new GeoLocation({
                longitude: coordinate.longitude,
                latitude: coordinate.latitude
              });

              coordinates.push({
                location: geoLoc,
                name: locationName
              });
            }
          }

          // add this attraction to our collected data
          facilitiesData[CleanRideID(element.id)] = {
            name: element.name.trim(),
            locations: coordinates,
            // hilariously some parks call is "fastPass" and some "fastPassPlus"
            fastPass: element.fastPass && element.fastPass == "true" ? true : (element.fastPassPlus && element.fastPassPlus === "true" ? true : false)
          };
        }

        return Promise.resolve(facilitiesData);
      });
    }, 60 * 60 * 24);
  }
}

module.exports = DisneyLegacyPark;
