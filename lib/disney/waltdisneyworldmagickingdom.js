const HostedPark = require('../hostedPark');

/**
 * Walt Disney World Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldMagicKingdom extends HostedPark {
  /**
   * Create a new WaltDisneyWorldMagicKingdom object
   */
  constructor(options = {}) {
    options.name = options.name || 'Magic Kingdom - Walt Disney World Florida';
    options.timezone = options.timezone || 'America/New_York';

    // set resort's general center point
    options.latitude = options.latitude || 28.3852;
    options.longitude = options.longitude || -81.5639;

    // inherit from base class
    super(options);
  }
}

module.exports = WaltDisneyWorldMagicKingdom;
