const CedarFairPark = require('./cedarfairparkbase');

/**
 * Knott's Berry Farm
 * @class
 * @extends CedarFairPark
 */
class KnottsBerryFarm extends CedarFairPark {
  /**
   * Create new KnottsBerryFarm Object
   */
  constructor(options = {}) {
    options.name = options.name || "Knott's Berry Farm";

    // park ID
    options.park_id = options.park_id || 'CF_KBF';

    // inject scary farm into special opening hours
    options.special_hours = options.special_hours || ['scaryfarm'];

    // entrance location
    options.latitude = 33.8442;
    options.longitude = -117.9986;

    // timezone
    options.timezone = 'America/Los_Angeles';

    // inherit from base class
    super(options);
  }
}

module.exports = KnottsBerryFarm;
