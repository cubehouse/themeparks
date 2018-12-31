const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags Hurricane Harbor, Arlington
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsHurricaneHarborArlington extends SixFlagsPark {
  /**
     * Create a new SixFlagsHurricaneHarborArlington object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags Hurricane Harbor, Arlington';
    options.timezone = options.timezone || 'America/Chicago';

    // set park's location as it's entrance
    options.latitude = options.latitude || 32.762;
    options.longitude = options.longitude || -97.0829;

    options.park_id = options.park_id || '10';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsHurricaneHarborArlington;
