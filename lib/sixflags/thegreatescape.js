const SixFlagsPark = require('./sixflagsbase');

/**
 * The Great Escape
 * @class
 * @extends SixFlagsPark
 */
class TheGreatEscape extends SixFlagsPark {
  /**
     * Create a new TheGreatEscape object
     */
  constructor(options = {}) {
    options.name = options.name || 'The Great Escape';
    options.timezone = options.timezone || 'America/New_York';

    // set park's location as it's entrance
    options.latitude = options.latitude || 43.3505;
    options.longitude = options.longitude || -73.69225;

    options.park_id = options.park_id || '24';

    // inherit from base class
    super(options);
  }
}

module.exports = TheGreatEscape;
