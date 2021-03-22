const HostedPark = require('../hostedPark');

/**
 * Universal Studios Florida
 * @class
 * @extends HostedPark
 */
class UniversalStudiosFlorida extends HostedPark {
  /**
   * Create a new UniversalStudiosFlorida object
   */
  constructor(options = {}) {
    options.name = options.name || 'Universal Studios Florida';
    options.timezone = options.timezone || 'America/New_York';

    // set park's location as it's entrance
    options.latitude = options.latitude || 28.4749822;
    options.longitude = options.longitude || -81.4664970;

    // inherit from base class
    super(options);
  }
}

module.exports = UniversalStudiosFlorida;
