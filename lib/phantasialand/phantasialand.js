const Park = require('../park');
const Location = require('../location');

const sParkAPIBase = Symbol('Phantasialand API Base URL');
const sParkAccessToken = Symbol('Phantasialand Access Token');
const sLongMin = Symbol('Minimum Random Longitude');
const sLongMax = Symbol('Maximum Random Longitude');
const sLatMin = Symbol('Minimum Random Latitude');
const sLatMax = Symbol('Maximum Random Latitude');

/**
 * Implements the Phantasialand API framework.
 * @class
 * @extends Park
 */
class Phantasialand extends Park {
  /**
   * Create new Phantasialand Object.
   * @param {Object} [options]
   * @param {String} [options.apiBase] Optional base URL for API requests
   */
  constructor(options = {}) {
    options.name = options.name || 'Phantasialand';

    // Phantasialand Entrance coordinates
    options.latitude = options.latitude || 50.798954;
    options.longitude = options.longitude || 6.879314;

    // park's timezone
    options.timezone = 'Europe/Berlin';

    super(options);

    this[sParkAPIBase] = options.apiBase || 'https://api.phlsys.de/api/';
    this[sParkAccessToken] = options.accessToken || 'auiJJnDpbIWrqt2lJBnD8nV9pcBCIprCrCxaWettkBQWAjhDAHtDxXBbiJvCzkUf';

    this[sLongMin] = options.longitudeMin || 6.878342628;
    this[sLongMax] = options.longitudeMax || 6.877570152;
    this[sLatMin] = options.latitudeMin || 50.800659529;
    this[sLatMax] = options.latitudeMax || 50.799683077;
  }

  FetchPOIData() {
    return this.HTTP({
      url: `${this[sParkAPIBase]}pois?filter[where][seasons][like]=%25SUMMER%25&compact=true&access_token=auiJJnDpbIWrqt2lJBnD8nV9pcBCIprCrCxaWettkBQWAjhDAHtDxXBbiJvCzkUf`,
      method: 'GET',
      data: {
        compact: true,
        access_token: this[sParkAccessToken],
      },
    }).then((data) => {
      const rides = {};

      data.forEach((ride) => {
        const location = (ride.entrance && ride.entrance.world) ? ride.entrance.world : undefined;
        rides[ride.id] = {
          name: ride.title.en ? ride.title.en : ride.title,
          meta: {
            area: ride.area.en ? ride.area.en : ride.area,
            longitude: location ? location.lng : null,
            latitude: location ? location.lat : null,
          },
        };
      });

      return Promise.resolve(rides);
    });
  }

  GetPOIData() {
    // cache POI data for 2 days
    return this.Cache.Wrap('POI', () => {
      return this.FetchPOIData();
    }, 60 * 60 * 48);
  }

  FetchWaitTimes() {
    return this.GetPOIData().then((poi) => {
      // generate random point within Phantasialand
      const RandomLocation = Location.RandomBetween(this[sLongMin], this[sLatMin], this[sLongMax], this[sLatMax]);

      return this.HTTP({
        url: `${this[sParkAPIBase]}signage-snapshots`,
        method: 'GET',
        data: {
          loc: `${RandomLocation.latitude},${RandomLocation.longitude}`,
          compact: true,
          access_token: this[sParkAccessToken],
        },
      }).then((rideData) => {
        rideData.forEach((ride) => {
          if (poi[ride.poiId]) {
            const ridePOI = poi[ride.poiId];
            let waitTime = -1;
            if (ride.open && ride.waitTime !== null) {
              // eslint-disable-next-line prefer-destructuring
              waitTime = ride.waitTime;
            }
            this.UpdateRide(ride.poiId, {
              name: ridePOI.name,
              meta: ridePOI.meta,
              waitTime,
            });
          }
        });

        return Promise.resolve();
      });
    });
  }

  FetchOpeningTimes() {
    // TODO
  }
}

module.exports = Phantasialand;

if (!module.parent) {
  const A = new Phantasialand();
  A.GetWaitTimes().then(console.log);
}
