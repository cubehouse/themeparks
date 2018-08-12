// import the base Disney park class
const DisneyBase = require('./disneyworldapibase.js');

/**
 * Walt Disney World Hollywood Studios
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldHollywoodStudios extends DisneyBase {
  /**
   * Create a new WaltDisneyWorldHollywoodStudios object
   */
  constructor(options = {}) {
    options.name = options.name || 'Hollywood Studios - Walt Disney World Florida';
    options.timezone = options.timezone || 'America/New_York';

    // set resort's general center point
    options.latitude = options.latitude || 28.3575;
    options.longitude = options.longitude || -81.5582;

    // Disney API configuration for Hollywood Studios
    options.resortId = options.resortId || '80007798';
    options.parkId = options.parkId || '80007998';
    options.parkRegion = options.parkRegion || 'us';
    options.resortCode = options.resortCode || 'wdw';

    // inherit from base class
    super(options);
  }
}

module.exports = WaltDisneyWorldHollywoodStudios;
