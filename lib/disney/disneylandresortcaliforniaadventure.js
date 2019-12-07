// import the base Disney park class
const DisneyBase = require('./disneyworldapibase.js');

/**
 * Disneyland Resort California Adventure
 * @class
 * @extends DisneyBase
 */
class DisneylandResortCaliforniaAdventure extends DisneyBase {
  /**
   * Create a new DisneylandResortCaliforniaAdventure object
   */
  constructor(options = {}) {
    options.name = options.name || 'California Adventure - Disneyland Resort';
    options.timezone = options.timezone || 'America/Los_Angeles';

    // set park's location as it's entrance
    options.latitude = options.latitude || 33.808720;
    options.longitude = options.longitude || -117.918990;

    // Disney API configuration for California Adventure
    options.resortId = options.resortId || '80008297';
    options.parkId = options.parkId || '336894';
    options.parkRegion = options.parkRegion || 'us';
    options.resortCode = options.resortCode || 'dlr';

    // DLR doesn't return as many days as WDW
    options.scheduleDaysToReturn = 30;

    // inherit from base class
    super(options);
  }
}

module.exports = DisneylandResortCaliforniaAdventure;
