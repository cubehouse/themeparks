const HostedPark = require('../hostedPark');

/**
 * Walt Disney World Hollywood Studios
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldHollywoodStudios extends HostedPark {
  /**
   * Create a new WaltDisneyWorldHollywoodStudios object
   */
  constructor(options = {}) {
    options.name = options.name || 'Hollywood Studios - Walt Disney World Florida';
    options.timezone = options.timezone || 'America/New_York';

    // set resort's general center point
    options.latitude = options.latitude || 28.3575;
    options.longitude = options.longitude || -81.5582;

    // inherit from base class
    super(options);
  }
}

module.exports = WaltDisneyWorldHollywoodStudios;
