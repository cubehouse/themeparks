const UniversalPark = require('./universalparkbase');

/**
 * Universal Volcano Bay
 * @class
 * @extends UniversalPark
 */
class UniversalVolcanoBay extends UniversalPark {
  /**
   * Create a new UniversalVolcanoBay object
   */
  constructor(options = {}) {
    options.name = options.name || 'Universal Volcano Bay';
    options.timezone = options.timezone || 'America/New_York';

    // set park's location as it's entrance
    options.latitude = options.latitude || 28.4623;
    options.longitude = options.longitude || -81.4707;

    // Volcano Bay park ID park ID
    options.parkId = options.parkId || 13801;

    // inherit from base class
    super(options);
  }
}

module.exports = UniversalVolcanoBay;
