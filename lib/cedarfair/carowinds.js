const CedarFairPark = require('./cedarfairparkbase');

/**
 * Carowinds
 * @class
 * @extends CedarFairPark
 */
class Carowinds extends CedarFairPark {
  /**
   * Create new Carowinds Object.
   */
  constructor(options = {}) {
    options.name = options.name || 'Carowinds';

    // park ID
    options.park_id = options.park_id || 'CF_CA';

    // entrance location
    options.latitude = 35.1045;
    options.longitude = -80.9394;

    // timezone
    options.timezone = 'America/New_York';

    // inherit from base class
    super(options);
  }
}

module.exports = Carowinds;
