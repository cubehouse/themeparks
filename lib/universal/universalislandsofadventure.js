const UniversalPark = require('./universalparkbase');

/**
 * Universal's Islands Of Adventure
 * @class
 * @extends UniversalPark
 */
class UniversalIslandsOfAdventure extends UniversalPark {
  /**
   * Create a new UniversalIslandsOfAdventure object
   */
  constructor(options = {}) {
    options.name = options.name || "Universal's Islands Of Adventure";
    options.timezone = options.timezone || 'America/New_York';

    // set park's location as it's entrance
    options.latitude = options.latitude || 28.4722430;
    options.longitude = options.longitude || -81.4678556;

    // Univesral park ID
    options.parkId = options.parkId || 10000;

    options.parkCity = 'Orlando';

    options.virtualLineTimes = true;

    // inherit from base class
    super(options);
  }
}

module.exports = UniversalIslandsOfAdventure;
