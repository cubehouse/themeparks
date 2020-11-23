const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags Hurricane Harbor, Los Angeles
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsHurricaneHarborLosAngeles extends SixFlagsPark {
  /**
     * Create a new SixFlagsHurricaneHarborLosAngeles object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags Hurricane Harbor, Los Angeles';
    options.timezone = options.timezone || 'America/Los_Angeles';

    // set park's location as it's entrance
    options.latitude = options.latitude || 34.42385;
    options.longitude = options.longitude || -118.595014;

    options.park_id = options.park_id || '11';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsHurricaneHarborLosAngeles;
