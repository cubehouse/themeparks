// include core Park class
const Park = require('../park');

const sApiBase = Symbol('Walibi Holland API Base URL');
const sLangPref = Symbol('Language Preferences');

class WalibiHolland extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Walibi Holland';

    // Walibi Holland from Google maps
    options.latitude = options.latitude || 52.44086770980989;
    options.longitude = options.longitude || 5.764768927236082;

    // Use the Android app's user-agent
    options.useragent = options.useragent || 'okhttp/3.9.1';

    // park's timezone
    options.timezone = 'Europe/Amsterdam';

    // inherit from base class
    super(options);

    // accept overriding the API base URL
    this[sApiBase] = options.apiBase || 'https://www.walibifastlane.nl/api';

    // accept overriding the language preference
    this[sLangPref] = options.langPref || 'en-US';
  }

  get FastPass() {
    return true;
  }

  /**
   * parses the Walibi Holland rideInfo and updates the rides
   * @param {Object[]} rideInfo An rideInfo Object from the API
   */
  updateWalibiHollandRides(rideInfo) {
    const getTranslatedValue = (sourceObject, key) => {
      if (!sourceObject) {
        return '';
      }

      let translation = {};
      if (this[sLangPref] === 'nl-NL') {
        translation = sourceObject;
      } else {
        translation = sourceObject.localizations.find((langObject) => langObject.culture === this[sLangPref]);
      }

      if (!translation || translation === {} || !translation[key]) {
        return '';
      }

      return translation[key];
    };

    rideInfo.forEach((ride) => {
      const rideUpdate = {
        waitTime: -1,
        active: false,
        status: 'Closed', // 'Operating', 'Refurbishment', 'Down', 'Closed'
        name: ride.name,
        fastPass: ride.useVirtualQueue,
        lastUpdate: new Date(),
        meta: {
          ride_type: ride.poiType,
          description: getTranslatedValue(ride, 'description'),
          latitude: ride.location.latitude,
          longitude: ride.location.longitude,
        },
        schedule: {
          openingTime: ride.openingTime,
        }
      };

      // TODO: Add more statuses as they get discovered
      switch (ride.state) {
        case 'closed':
        case 'closed_indefinitely':
          // Do nothing, has already been set as default value.
          break;
        case 'open':
          // TODO: Check what the exact value of this is in the JSON once the park is back open again!
          rideUpdate.status = 'Operating';
          rideUpdate.active = true;
          rideUpdate.waitTime = Number(ride.waitTimeMins);
          break;
        default:
          // Do nothing, this is just for the sake of having a switch case default statement
      }

      this.UpdateRide(rideUpdate.name, rideUpdate);
    });
  }

  FetchWaitTimes() {
    return this.HTTP({
      url: `${this[sApiBase]}/api/guest/rides`,   // Yes, the API URL really is .../api/api/...
      returnFullResponse: true,
      mock: 'walibiHollandRides',
    }).then((data) => {
      this.updateWalibiHollandRides(data.body);
      return Promise.resolve();
    });
  }

  FetchOpeningTimes() {
    return Promise.resolve();
  }

  /* eslint-disable class-methods-use-this */
  // this park supports ride schedules
  get SupportsRideSchedules() {
    return true;
  }
  /* eslint-enable class-methods-use-this */
}

// export the class
module.exports = WalibiHolland;
