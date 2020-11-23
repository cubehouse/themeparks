const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags Over Georgia
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsOverGeorgia extends SixFlagsPark {
  /**
     * Create a new SixFlagsOverGeorgia object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags Over Georgia';
    options.timezone = options.timezone || 'America/New_York';

    // set park's location as it's entrance
    options.latitude = options.latitude || 33.770579;
    options.longitude = options.longitude || -84.55149;

    options.park_id = options.park_id || '2';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsOverGeorgia;
