const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags Great America
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsGreatAmerica extends SixFlagsPark {
  /**
     * Create a new SixFlagsGreatAmerica object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags Great America';
    options.timezone = options.timezone || 'America/Chicago';

    // set park's location as it's entrance
    options.latitude = options.latitude || 42.370244;
    options.longitude = options.longitude || -87.935916;

    options.park_id = options.park_id || '7';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsGreatAmerica;
