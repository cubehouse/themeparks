// include core Park class
const Park = require('../park');

const sApiBase = Symbol('Toverland API Base URL');
const sApiVersion = Symbol('Toverland API Version');

class Toverland extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Toverland';

    // Heide Park Resort from Google maps
    options.latitude = options.latitude || 51.39688449207086;
    options.longitude = options.longitude || 5.984768038311225;

    // Use the Android app's user-agent
    options.useragent = options.useragent || 'okhttp/3.9.1';

    // park's timezone
    options.timezone = 'Europe/Amsterdam';

    // inherit from base class
    super(options);

    // accept overriding API version
    this[sApiVersion] = options.apiVersion || 'v1';

    // accept overriding the API base URL
    this[sApiBase] = options.apiBase || 'https://api.toverland.com/';
  }

  get FastPass() {
    return false;
  }

  /**
   * parses the Toverland operationInfo and updates the rides
   * @param {Object[]} operationInfo An operationInfo Object Array from the API
   * @param {String} type The Type of the timeEntries ['ride', 'halloween'
   */
  updateToverlandOperationInfo(operationInfo) {
    operationInfo.forEach((ride) => {
      const rideUpdate = {
        waitTime: -1,
        active: false,
        status: 'Closed', // 'Operating', 'Refurbishment', 'Down', 'Closed'
        name: ride.name,
        fastPass: false,
        latitude: ride.latitude,
        longitude: ride.longitude,
        meta: {
          ride_type: ride.header_description,
          short_description: ride.short_description,
          description: ride.desription,
          thumbnail: ride.thumbnail,
        },
      };

      // TODO: Add more statuses as they get discovered
      switch (ride.last_status.status.name.en) {
        case 'Closed':
          // Do nothing, has already been set as default value.
          break;
        case 'Open':
          rideUpdate.status = 'Operating';
          rideUpdate.active = true;
          rideUpdate.waitTime = Number(ride.last_waiting_time.waiting_time);
          break;
        default:
          // Do nothing, just for the sake of having a switch case statement that is
      }

      this.UpdateRide(rideUpdate.name, rideUpdate);
    });
  }

  FetchWaitTimes() {
    return this.HTTP({
      url: `${this[sApiBase]}${this[sApiVersion]}/park/ride/operationInfo/list`,
      returnFullResponse: true,
      mock: 'toverlandOperationInfo',
    }).then((data) => {
      const result = JSON.parse(data);
      this.updateOperationInfo(result);
      return Promise.resolve();
    });
  }
}

// export the class
module.exports = Toverland;
