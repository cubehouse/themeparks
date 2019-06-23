const Park = require('../park');

const sParkAPIBase = Symbol('Gardaland API Base URL');
const sSignature = Symbol('Garaland Signature');

/**
 * Implements the Gardaland API framework.
 * @class
 * @extends Park
 */
class Gardaland extends Park {
  /**
   * Create new Gardaland Object.
   * @param {Object} [options]
   * @param {String} [options.apiBase] Optional base URL for API requests
   * @param {String} [options.apiSignature] Optional API token for wait time requests
   */
  constructor(options = {}) {
    options.name = options.name || 'Gardaland';

    // Europa-Park coordinates
    options.latitude = options.latitude || 45.453835;
    options.longitude = options.longitude || 10.714561;

    options.useragent = 'Appcelerator Titanium/7.1.1 (Google Nexus 5X; Android API Level: 28; en-GB;)';

    // park's timezone
    options.timezone = 'Europe/Rome';

    super(options);

    this[sParkAPIBase] = options.apiBase || 'http://merlincms.com';
    this[sSignature] = options.apiSignature || '704k{30E51jovOE';
  }

  FetchWaitTimes() {
    return this.HTTP({
      url: `${this[sParkAPIBase]}/qfetcher/getGardaQ.php`,
      method: 'POST',
      data: `{"signature":"${this[sSignature]}"}`,
      forceJSON: true,
    }).then((data) => {
      data.Attractions.Attraction.forEach((ride) => {
        // haven't got any unique IDs, so make one up
        const rideID = ride.Name.toLowerCase().replace(/[^a-z0-9]/g, '');

        // one of the rides is called "(null)"... ignore it
        if (rideID !== 'null') {
          this.UpdateRide(rideID, {
            name: ride.Name,
            waitTime: Number(ride.DisplayWaitTime),
          });
        }
      });
      return Promise.resolve();
    });
  }

  FetchOpeningTimes() {
    // TODO
  }
}

module.exports = Gardaland;

if (!module.parent) {
  const A = new Gardaland();
  A.GetWaitTimes().then(console.log);
}
