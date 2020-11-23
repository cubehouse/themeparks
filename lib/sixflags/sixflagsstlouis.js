const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags St. Louis
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsStLouis extends SixFlagsPark {
  /**
     * Create a new SixFlagsStLouis object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags St. Louis';
    options.timezone = options.timezone || 'America/Chicago';

    // set park's location as it's entrance
    options.latitude = options.latitude || 38.513226;
    options.longitude = options.longitude || -90.675191;

    options.park_id = options.park_id || '3';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsStLouis;
