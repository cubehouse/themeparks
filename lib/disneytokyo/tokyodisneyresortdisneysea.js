const HostedPark = require('../hostedPark');

/**
 * Tokyo Disney Resort - Disney Sea
 * @class
 * @extends DisneyTokyoPark
 */
class TokyoDisneyResortDisneySea extends HostedPark {
  /**
   * Create a new TokyoDisneyResortDisneySea object
   */
  constructor(options = {}) {
    options.name = options.name || 'Disney Sea - Tokyo Disney Resort';
    options.timezone = options.timezone || 'Asia/Tokyo';

    // set park's location as it's entrance
    options.latitude = options.latitude || 35.627055;
    options.longitude = options.longitude || 139.889097;

    // inherit from base class
    super(options);
  }

  get ParkAPIID() {
    return 'TokyoDisneySea';
  }
}

module.exports = TokyoDisneyResortDisneySea;
