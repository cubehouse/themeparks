const SixFlagsPark = require('./sixflagsbase');

/**
 * Six Flags Fiesta Texas
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsFiestaTexas extends SixFlagsPark {
  /**
     * Create a new SixFlagsFiestaTexas object
     */
  constructor(options = {}) {
    options.name = options.name || 'Six Flags Fiesta Texas';
    options.timezone = options.timezone || 'America/Chicago';

    // set park's location as it's entrance
    options.latitude = options.latitude || 29.599801;
    options.longitude = options.longitude || -98.609028;

    options.park_id = options.park_id || '8';

    // inherit from base class
    super(options);
  }
}

module.exports = SixFlagsFiestaTexas;
