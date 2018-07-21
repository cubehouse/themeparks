// import the base Disney park class
const DisneyBase = require('./index.js');

/**
 * Walt Disney World Animal Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldAnimalKingdom extends DisneyBase {
  /**
   * Create a new WaltDisneyWorldAnimalKingdom object
   */
  constructor(options = {}) {
    options.name = options.name || 'Animal Kingdom - Walt Disney World Florida';
    options.timezone = options.timezone || 'America/New_York';

    // set resort's general center point
    options.latitude = options.latitude || 28.3553;
    options.longitude = options.longitude || -81.5901;

    // Disney API configuration for Animal Kingdom
    options.resort_id = options.resort_id || '80007798';
    options.park_id = options.park_id || '80007823';
    options.park_region = options.park_region || 'us';
    options.resort_code = options.resort_code || 'wdw';

    // inherit from base class
    super(options);
  }
}

module.exports = WaltDisneyWorldAnimalKingdom;
