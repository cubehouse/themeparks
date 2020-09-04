const HostedPark = require('../hostedPark');

/**
 * Disneyland Resort Magic Kingdom
 * @class
 * @extends DisneyBase
 */
class DisneylandResortMagicKingdom extends HostedPark {
  /**
   * Create a new WaltDisneyWorldMagicKingdom object
   */
  constructor(options = {}) {
    options.name = options.name || 'Magic Kingdom - Disneyland Resort';
    options.timezone = options.timezone || 'America/Los_Angeles';

    // set resort's general center point
    options.latitude = options.latitude || 33.810109;
    options.longitude = options.longitude || -117.918971;

    // inherit from base class
    super(options);
  }
}

module.exports = DisneylandResortMagicKingdom;
