const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags Discovery Kingdom
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsDiscoveryKingdom extends SixFlagsPark {
  /**
     * Create a new SixFlagsDiscoveryKingdom object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags Discovery Kingdom';
    options.timezone = options.timezone || 'America/Los_Angeles';

    // set park's location as it's entrance
    options.latitude = options.latitude || 38.13873;
    options.longitude = options.longitude || -122.23325;

    options.park_id = options.park_id || '17';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsDiscoveryKingdom;
