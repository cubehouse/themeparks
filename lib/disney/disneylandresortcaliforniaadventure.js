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
    options.name = options.name || 'Disneyland Resort - California Adventure';
    options.timezone = options.timezone || 'America/Los_Angeles';

    // set park's location as it's entrance
    options.latitude = options.latitude || 33.808720;
    options.longitude = options.longitude || -117.918990;

    // Disney API configuration for California Adventure
    options.resort_id = options.resort_id || '80008297';
    options.park_id = options.park_id || '336894';
    options.park_region = options.park_region || 'us';
    options.resort_code = options.resort_code || 'dlr';

    // inherit from base class
    super(options);
  }
}

module.exports = DisneylandResortCaliforniaAdventure;
