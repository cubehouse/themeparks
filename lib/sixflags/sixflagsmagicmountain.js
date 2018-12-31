const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags Magic Mountain
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsMagicMountain extends SixFlagsPark {
  /**
     * Create a new SixFlagsMagicMountain object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags Magic Mountain';
    options.timezone = options.timezone || 'America/Los_Angeles';

    // set park's location as it's entrance
    options.latitude = options.latitude || 34.423461;
    options.longitude = options.longitude || -118.595251;

    options.park_id = options.park_id || '6';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsMagicMountain;
