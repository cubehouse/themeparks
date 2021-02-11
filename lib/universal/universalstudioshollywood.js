const HostedPark = require('../hostedPark');

/**
 * Universal Studios Hollywood
 * @class
 * @extends HostedPark
 */
class UniversalStudiosHollywood extends HostedPark {
  /**
   * Create a new UniversalStudiosHollywood object
   */
  constructor(options = {}) {
    options.name = options.name || 'Universal Studios Hollywood';
    options.timezone = options.timezone || 'America/Los_Angeles';

    // set park's location as it's entrance
    options.latitude = options.latitude || 34.137261;
    options.longitude = options.longitude || -118.355516;

    // inherit from base class
    super(options);
  }

  get ParkAPIID() {
    return 'UniversalStudios';
  }
}

module.exports = UniversalStudiosHollywood;
