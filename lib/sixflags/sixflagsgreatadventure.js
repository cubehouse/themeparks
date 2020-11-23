const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags Great Adventure
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsGreatAdventure extends SixFlagsPark {
  /**
     * Create a new SixFlagsGreatAdventure object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags Great Adventure';
    options.timezone = options.timezone || 'America/New_York';

    // set park's location as it's entrance
    options.latitude = options.latitude || 40.148661;
    options.longitude = options.longitude || -74.441025;

    options.park_id = options.park_id || '5';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsGreatAdventure;
