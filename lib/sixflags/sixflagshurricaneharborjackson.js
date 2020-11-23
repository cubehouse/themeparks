const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags Hurricane Harbor, Jackson
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsHurricaneHarborJackson extends SixFlagsPark {
  /**
     * Create a new SixFlagsHurricaneHarborJackson object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags Hurricane Harbor, Jackson';
    options.timezone = options.timezone || 'America/New_York';

    // set park's location as it's entrance
    options.latitude = options.latitude || 40.1384;
    options.longitude = options.longitude || -74.4405;

    options.park_id = options.park_id || '23';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsHurricaneHarborJackson;
