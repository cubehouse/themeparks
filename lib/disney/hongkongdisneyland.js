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
    options.resortId = options.resortId || 'hkdl';
    options.parkId = options.parkId || 'desHongKongDisneyland';
    options.resortRegion = options.resortRegion || 'INTL';
    options.resortCode = options.resortCode || 'hkdl';

    // inherit from base class
    super(options);
  }
}

module.exports = HongKongDisneyland;
