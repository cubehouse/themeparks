// import the base Disney park class
const DisneyBase = require('./disneyworldapibase.js');

/**
 * Disneyland Resort Magic Kingdom
 * @class
 * @extends DisneyBase
 */
class DisneylandResortMagicKingdom extends DisneyBase {
  /**
   * Create a new WaltDisneyWorldMagicKingdom object
   */
  constructor(options = {}) {
    options.name = options.name || 'Magic Kingdom - Disneyland Resort';
    options.timezone = options.timezone || 'America/Los_Angeles';

    // set resort's general center point
    options.latitude = options.latitude || 33.810109;
    options.longitude = options.longitude || -117.918971;

    // Disney API configuration for Magic Kingdom
    options.resortId = options.resortId || '80008297';
    options.parkId = options.parkId || '330339';
    options.parkRegion = options.parkRegion || 'us';
    options.resortCode = options.resortCode || 'dlr';

    // DLR doesn't return as many days as WDW
    options.scheduleDaysToReturn = 30;

    // inherit from base class
    super(options);
  }
}

module.exports = DisneylandResortMagicKingdom;
