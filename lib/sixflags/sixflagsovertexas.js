const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags Over Texas
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsOverTexas extends SixFlagsPark {
  /**
     * Create a new SixFlagsOverTexas object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags Over Texas';
    options.timezone = options.timezone || 'America/Chicago';

    // set park's location as it's entrance
    options.latitude = options.latitude || 32.754985;
    options.longitude = options.longitude || -97.070369;

    options.park_id = options.park_id || '1';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsOverTexas;
