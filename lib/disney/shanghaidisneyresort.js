const HostedPark = require('../hostedPark');

/**
 * Shanghai Disney Resort - Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class ShanghaiDisneyResortMagicKingdom extends HostedPark {
  /**
   * Create a new ShanghaiDisneyResortMagicKingdom object
   */
  constructor(options = {}) {
    options.name = options.name || 'Magic Kingdom - Shanghai Disney Resort';
    options.timezone = options.timezone || 'Asia/Shanghai';

    // set park's location as it's entrance
    options.latitude = options.latitude || 31.1433;
    options.longitude = options.longitude || 121.6580;

    // inherit from base class
    super(options);
  }

  get ParkAPIID() {
    return 'ShanghaiDisneylandPark';
  }
}

module.exports = ShanghaiDisneyResortMagicKingdom;
