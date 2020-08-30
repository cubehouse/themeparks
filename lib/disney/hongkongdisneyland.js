const HostedPark = require('../hostedPark');

/**
 * Hong Kong Disneyland
 * @class
 * @extends WaltDisneyWorldPark
 */
class HongKongDisneyland extends HostedPark {
  /**
   * Create a new HongKongDisneyland object
   */
  constructor(options = {}) {
    options.name = options.name || 'Hong Kong Disneyland';
    options.timezone = options.timezone || 'Asia/Hong_Kong';

    // set park's location as it's entrance
    options.latitude = options.latitude || 22.3132;
    options.longitude = options.longitude || 114.0445;

    // inherit from base class
    super(options);
  }

  get ParkAPIID() {
    return 'HongKongDisneylandPark';
  }
}

module.exports = HongKongDisneyland;
