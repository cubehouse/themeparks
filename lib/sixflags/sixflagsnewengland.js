const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags New England
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsNewEngland extends SixFlagsPark {
  /**
     * Create a new SixFlagsNewEngland object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags New England';
    options.timezone = options.timezone || 'America/New_York';

    // set park's location as it's entrance
    options.latitude = options.latitude || 42.037929;
    options.longitude = options.longitude || -72.615532;

    options.park_id = options.park_id || '20';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsNewEngland;
