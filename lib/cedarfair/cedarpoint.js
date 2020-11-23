const CedarFairPark = require('./cedarfairparkbase');

/**
 * Cedar Point
 * @class
 * @extends CedarFairPark
 */
class CedarPoint extends CedarFairPark {
  /**
   * Create new CedarPoint Object
   */
  constructor(options = {}) {
    options.name = options.name || 'Cedar Point';

    // park ID
    options.park_id = options.park_id || 'CF_CP';

    // entrance location
    options.latitude = 41.4784;
    options.longitude = -82.6793;

    // timezone
    options.timezone = 'America/New_York';

    // inherit from base class
    super(options);
  }
}

module.exports = CedarPoint;
