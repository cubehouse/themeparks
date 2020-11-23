const CedarFairPark = require('./cedarfairparkbase');

/**
 * Canada's Wonderland
 * @class
 * @extends CedarFairPark
 */
class CanadasWonderland extends CedarFairPark {
  /**
   * Create new CanadasWonderland Object.
   */
  constructor(options = {}) {
    options.name = options.name || "Canada's Wonderland";

    // park ID
    options.park_id = options.park_id || 'CF_CW';

    // entrance location
    options.latitude = 43.8430;
    options.longitude = -79.5390;

    // timezone
    options.timezone = 'America/Toronto';

    // inherit from base class
    super(options);
  }
}

module.exports = CanadasWonderland;
