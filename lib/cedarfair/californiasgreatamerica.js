const CedarFairPark = require('./cedarfairparkbase');

/**
 * Great America
 * @class
 * @extends CedarFairPark
 */
class CaliforniasGreatAmerica extends CedarFairPark {
  /**
   * Create new Great America Object.
   */
  constructor(options = {}) {
    options.name = options.name || "California's Great America";

    // park ID
    options.park_id = options.park_id || 'CF_GA';

    // entrance location
    options.latitude = 37.397799;
    options.longitude = -121.974717;

    // timezone
    options.timezone = 'America/Los_Angeles';

    // inherit from base class
    super(options);
  }
}

module.exports = CaliforniasGreatAmerica;
