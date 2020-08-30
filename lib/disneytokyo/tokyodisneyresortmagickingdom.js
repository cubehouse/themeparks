const HostedPark = require('../hostedPark');

/**
 * Tokyo Disney Resort - Magic Kingdom
 * @class
 * @extends DisneyTokyoPark
 */
class TokyoDisneyResortMagicKingdom extends HostedPark {
  /**
   * Create a new TokyoDisneyResortMagicKingdom object
   */
  constructor(options = {}) {
    options.name = options.name || 'Magic Kingdom - Tokyo Disney Resort';
    options.timezone = options.timezone || 'Asia/Tokyo';

    // set park's location as it's entrance
    options.latitude = options.latitude || 35.634848;
    options.longitude = options.longitude || 139.879295;

    // inherit from base class
    super(options);
  }

  get ParkAPIID() {
    return 'TokyoDisneyland';
  }
}

module.exports = TokyoDisneyResortMagicKingdom;
