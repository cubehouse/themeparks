const crypto = require('crypto');
const Park = require('../park');

const sApiBase = Symbol('Island H20 Live Park API Base URL');
const sTokenSalt = Symbol('Island H20 Token Salt');
const sAppID = Symbol('App ID');

/**
 * Implements the Island H20 Live API framework.
 * @class
 * @extends Park
 */
class IslandH20Live extends Park {
  /**
   * Create new IslandH20Live Object.
   * @param {Object} [options]
   * @param {String} [options.apiBase] Optional base URL for API requests
   */
  constructor(options = {}) {
    options.name = options.name || 'IslandH20Live';

    // Island H20 Live Entrance coordinates
    options.latitude = options.latitude || 28.343379;
    options.longitude = options.longitude || -81.606582;

    // park's timezone
    options.timezone = 'America/New_York';

    // inherit from base class
    super(options);

    // accept overriding the API base URL
    this[sApiBase] = options.apiBase || 'https://horizon.vantagelabs.co/vapi/';
    this[sTokenSalt] = options.tokenSalt || 'scfj8ut3';
    this[sAppID] = options.appID || 'vantagega';
  }

  GetAPIToken() {
    return this.Cache.Wrap('token', () => {
      return this.HTTP({
        url: `${this[sApiBase]}login.php`,
        method: 'GET',
        data: {
          id: this[sAppID],
        },
        forceJSON: true,
      }).then((data) => {
        if (data.result !== 'OK') {
          return Promise.reject(new Error(`Unable to login to Island H20 Live: ${data.mantext}`));
        }

        // generate API token using our salt and random string from the login script
        const apiToken = crypto.createHash('md5').update(`${this[sAppID]}+${this[sTokenSalt]}+${data.data.random}`).digest('hex');

        return Promise.resolve(apiToken);
      });
    }, 60 * 60 * 2); // cache for 2 hours
  }

  /** Wrapper for making HTTP requests against the Island H20 Live API */
  MakeAPIRequest(options) {
    return this.GetAPIToken().then((token) => {
      // inject our API token and app ID to the HTTP options
      if (!options.data) {
        options.data = {};
      }
      options.data.token = token;
      options.data.id = this[sAppID];

      // default these to POST
      if (!options.method) {
        options.method = 'POST';
      }

      options.forceJSON = true;

      return this.HTTP(options);
    });
  }

  FetchWaitTimes() {
    return this.MakeAPIRequest({
      url: `${this[sApiBase]}ListAttractions.php`,
    }).then((data) => {
      if (data.result === 'OK') {
        data.data.forEach((ride) => {
          this.UpdateRide(ride.id, {
            name: ride.name,
            // TODO - down/closed status?
            waitTime: ride.waittime,
            meta: {
              // yep, rides have gamified points here. I love it, so add these to the meta data
              points: ride.perks,
            },
          });
        });

        return Promise.resolve();
      }

      return Promise.reject(new Error(`Island H20 API returned unexpected response ${data.result}`));
    });
  }

  // TODO - opening times
  FetchOpeningTimes() {
    return Promise.reject(new Error('Not Implemented'));
  }
}

// export the class
module.exports = IslandH20Live;

if (!module.parent) {
  const A = new IslandH20Live();
  A.GetWaitTimes().then(console.log);
}
