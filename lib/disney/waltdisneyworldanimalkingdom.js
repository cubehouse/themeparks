// import the base Disney park class
const DisneyBase = require('./disneyworldapibase.js');

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
    options.resortId = options.resortId || '80007798';
    options.parkId = options.parkId || '80007823';
    options.parkRegion = options.parkRegion || 'us';
    options.resortCode = options.resortCode || 'wdw';

    // inherit from base class
    super(options);
  }
}

module.exports = WaltDisneyWorldAnimalKingdom;
