const UniversalPark = require('./universalparkbase');

/**
 * Universal Studios Florida
 * @class
 * @extends UniversalPark
 */
class UniversalStudiosFlorida extends UniversalPark {
  /**
   * Create a new UniversalStudiosFlorida object
   */
  constructor(options = {}) {
    options.name = options.name || 'Universal Studios Florida';
    options.timezone = options.timezone || 'America/New_York';

    // set park's location as it's entrance
    options.latitude = options.latitude || 28.4749822;
    options.longitude = options.longitude || -81.4664970;

    // Univesral park ID
    options.parkId = options.parkId || 10010;

    // City name required for virtual lines
    options.parkCity = 'Orlando';

    // Turn on virtual line times
    options.virtualLineTimes = true;

    // inherit from base class
    super(options);
  }
}

module.exports = UniversalStudiosFlorida;
