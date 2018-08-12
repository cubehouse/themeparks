// import the base Disney park class
const DisneyLegacy = require('./disneylegacyapi.js');

/**
 * Hong Kong Disneyland
 * @class
 * @extends WaltDisneyWorldPark
 */
class HongKongDisneyland extends DisneyLegacy {
  /**
   * Create a new HongKongDisneyland object
   */
  constructor(options = {}) {
    options.name = options.name || 'Hong Kong Disneyland';
    options.timezone = options.timezone || 'Asia/Hong_Kong';

    // set park's location as it's entrance
    options.latitude = options.latitude || 22.3132;
    options.longitude = options.longitude || 114.0445;

    // Disney API configuration for Shanghai Magic Kingdom
    options.resort_id = options.resort_id || 'hkdl';
    options.park_id = options.park_id || 'desHongKongDisneyland';
    options.resort_region = options.resort_region || 'INTL';
    options.resort_code = options.resort_code || 'hkdl';

    // inherit from base class
    super(options);
  }
}

module.exports = HongKongDisneyland;
