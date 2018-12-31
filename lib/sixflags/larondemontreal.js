const SixFlagsPark = require('./sixflagsbase');

/**
 * La Ronde, Montreal
 * @class
 * @extends SixFlagsPark
 */
class LaRondeMontreal extends SixFlagsPark {
  /**
   * Create a new LaRondeMontreal object
   */
  constructor(options = {}) {
    options.name = options.name || 'La Ronde, Montreal';
    options.timezone = options.timezone || 'America/Toronto';

    // set park's location as it's entrance
    options.latitude = options.latitude || 45.521994;
    options.longitude = options.longitude || -73.534578;

    options.park_id = options.park_id || '29';

    // inherit from base class
    super(options);
  }
}

module.exports = LaRondeMontreal;
