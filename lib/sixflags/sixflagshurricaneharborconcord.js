const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags Hurricane Harbor, Concord
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsHurricaneHarborConcord extends SixFlagsPark {
  /**
   * Create a new SixFlagsHurricaneHarborConcord object
   */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags Hurricane Harbor, Concord';
    options.timezone = options.timezone || 'America/Los_Angeles';

    // set park's location as it's entrance
    options.latitude = options.latitude || 37.973304;
    options.longitude = options.longitude || -122.05055;

    options.park_id = options.park_id || '42';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsHurricaneHarborConcord;
