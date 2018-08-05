// import the base Disney park class
const DisneyBase = require('./disneyworldapibase.js');

/**
 * Walt Disney World Epcot
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldEpcot extends DisneyBase {
  /**
   * Create a new WaltDisneyWorldEpcot object
   */
  constructor(options = {}) {
    options.name = options.name || 'Epcot - Walt Disney World Florida';
    options.timezone = options.timezone || 'America/New_York';

    // set resort's general center point
    options.latitude = options.latitude || 28.3747;
    options.longitude = options.longitude || -81.5494;

    // Disney API configuration for Epcot
    options.resort_id = options.resort_id || '80007798';
    options.park_id = options.park_id || '80007838';
    options.park_region = options.park_region || 'us';
    options.resort_code = options.resort_code || 'wdw';

    // inherit from base class
    super(options);
  }
}

module.exports = WaltDisneyWorldEpcot;
