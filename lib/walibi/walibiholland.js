const Walibi = require('./walibi');

/**
 * Walibi Holland
 * @class
 * @extends Walibi
 */
class WalibiHolland extends Walibi {
  /**
   * Create a new WalibiHolland object
   */
  constructor(options = {}) {
    const year = new Date().getFullYear();

    options.name = options.name || 'Walibi Holland';
    options.timezone = options.timezone || 'Europe/Amsterdam';
    options.useragent = 'okhttp/3.9.1';

    // set park's location as it's entrance
    options.latitude = options.latitude || 52.44086770980989;
    options.longitude = options.longitude || 5.764768927236082;

    // Park API options
    options.waitTimesURL = 'https://www.walibifastlane.nl/api/api/guest/rides'; // Yes, the API URL really is .../api/api/...;
    options.calendarURL = `https://www.walibi.nl/en/api/calendar/${year}?_format=json`;

    // inherit from base class
    super(options);
  }

  /**
   * parses the Walibi rideInfo and updates the rides
   * @param {Object[]} rideInfo An rideInfo Object from the API
   */
  updateWalibiHollandRides(rideInfo) {
    const getTranslatedValue = (sourceObject, key) => {
      if (!sourceObject) {
        return '';
      }

      let translation = {};
      if (this[this.sLangPref] === 'nl-NL') {
        translation = sourceObject;
      } else {
        translation = sourceObject.localizations.find(langObject => langObject.culture === this[this.sLangPref]);
      }

      if (!translation || translation === {} || !translation[key]) {
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
        },
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
      url: this[this.sWaitTimesURL],
      returnFullResponse: true,
      mock: 'walibihollandRides',
    }).then((data) => {
      this.updateWalibiHollandRides(data.body);
      return Promise.resolve();
    });
  }
}

module.exports = WalibiHolland;
