const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags White Water, Atlanta
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsWhiteWaterAtlanta extends SixFlagsPark {
  /**
     * Create a new SixFlagsWhiteWaterAtlanta object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags White Water, Atlanta';
    options.timezone = options.timezone || 'America/New_York';

    // set park's location as it's entrance
    options.latitude = options.latitude || 33.959128;
    options.longitude = options.longitude || -84.519548;

    options.park_id = options.park_id || '25';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsWhiteWaterAtlanta;
