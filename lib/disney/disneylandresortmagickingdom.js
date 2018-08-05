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
    options.name = options.name || 'Disneyland Resort - Magic Kingdom';
    options.timezone = options.timezone || 'America/Los_Angeles';

    // set resort's general center point
    options.latitude = options.latitude || 33.810109;
    options.longitude = options.longitude || -117.918971;

    // Disney API configuration for Magic Kingdom
    options.resort_id = options.resort_id || '80008297';
    options.park_id = options.park_id || '330339';
    options.park_region = options.park_region || 'us';
    options.resort_code = options.resort_code || 'dlr';

    // inherit from base class
    super(options);
  }
}

module.exports = DisneylandResortMagicKingdom;
