const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags Hurricane Harbor, Oaxtepec
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsHurricaneHarborOaxtepec extends SixFlagsPark {
  /**
     * Create a new SixFlagsHurricaneHarborOaxtepec object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags Hurricane Harbor, Oaxtepec';
    options.timezone = options.timezone || 'America/Mexico_City';

    // set park's location as it's entrance
    options.latitude = options.latitude || 18.8967;
    options.longitude = options.longitude || -98.9754;

    options.park_id = options.park_id || '32';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsHurricaneHarborOaxtepec;
