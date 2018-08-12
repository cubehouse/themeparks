// import the base Disney park class
const DisneyBase = require('./disneyworldapibase.js');

/**
 * Walt Disney World Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldMagicKingdom extends DisneyBase {
  /**
   * Create a new WaltDisneyWorldMagicKingdom object
   */
  constructor(options = {}) {
    options.name = options.name || 'Magic Kingdom - Walt Disney World Florida';
    options.timezone = options.timezone || 'America/New_York';

    // set resort's general center point
    options.latitude = options.latitude || 28.3852;
    options.longitude = options.longitude || -81.5639;

    // Disney API configuration for Magic Kingdom
    options.resortId = options.resortId || '80007798';
    options.parkId = options.parkId || '80007944';
    options.parkRegion = options.parkRegion || 'us';
    options.resortCode = options.resortCode || 'wdw';

    // inherit from base class
    super(options);
  }
}

module.exports = WaltDisneyWorldMagicKingdom;
