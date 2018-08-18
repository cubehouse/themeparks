const CedarFairPark = require('./cedarfairparkbase');

/**
 * KingsIsland
 * @class
 * @extends CedarFairPark
 */
class KingsIsland extends CedarFairPark {
  /**
   * Create new KingsIsland Object.
   */
  constructor(options = {}) {
    options.name = options.name || 'Kings Island';

    // park ID
    options.park_id = options.park_id || 'CF_KI';

    // entrance location
    options.latitude = 39.3447;
    options.longitude = -84.2686;

    // timezone
    options.timezone = 'America/New_York';

    // inherit from base class
    super(options);
  }
}

module.exports = KingsIsland;
