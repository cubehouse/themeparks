const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags America
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsAmerica extends SixFlagsPark {
  /**
   * Create a new SixFlagsAmerica object
   */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags America';
    options.timezone = options.timezone || 'America/New_York';

    // set park's location as it's entrance
    options.latitude = options.latitude || 38.901238;
    options.longitude = options.longitude || -76.771276;

    options.park_id = options.park_id || '14';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsAmerica;
