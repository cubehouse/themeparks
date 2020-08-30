const HostedPark = require('../hostedPark');

/**
 * Walt Disney World Epcot
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldEpcot extends HostedPark {
  /**
   * Create a new WaltDisneyWorldEpcot object
   */
  constructor(options = {}) {
    options.name = options.name || 'Epcot - Walt Disney World Florida';
    options.timezone = options.timezone || 'America/New_York';

    // set resort's general center point
    options.latitude = options.latitude || 28.3747;
    options.longitude = options.longitude || -81.5494;

    // inherit from base class
    super(options);
  }
}

module.exports = WaltDisneyWorldEpcot;
