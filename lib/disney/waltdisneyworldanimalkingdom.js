const HostedPark = require('../hostedPark');

/**
 * Walt Disney World Animal Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldAnimalKingdom extends HostedPark {
  /**
   * Create a new WaltDisneyWorldAnimalKingdom object
   */
  constructor(options = {}) {
    options.name = options.name || 'Animal Kingdom - Walt Disney World Florida';
    options.timezone = options.timezone || 'America/New_York';

    // set resort's general center point
    options.latitude = options.latitude || 28.3553;
    options.longitude = options.longitude || -81.5901;

    // inherit from base class
    super(options);
  }
}

module.exports = WaltDisneyWorldAnimalKingdom;
