// import the base Disney park class
const DisneyLegacy = require('./disneylegacyapi.js');

/**
 * Disneyland Paris - Walt Disney Studios
 * @class
 * @extends WaltDisneyWorldPark
 */
class DisneylandParisWaltDisneyStudios extends DisneyLegacy {
  /**
   * Create a new DisneylandParisWaltDisneyStudios object
   */
  constructor(options = {}) {
    options.name = options.name || 'Walt Disney Studios - Disneyland Paris';
    options.timezone = options.timezone || 'Europe/Paris';

    // set park's location as it's entrance
    options.latitude = options.latitude || 48.868271;
    options.longitude = options.longitude || 2.780719;

    // Disney API configuration for Disneyland Paris Walt Disney Studios
    options.resort_id = options.resort_id || 'dlp';
    options.park_id = options.park_id || 'P2';
    options.park_region = options.park_region || 'fr';
    options.resort_code = options.resort_code || 'dlp';

    // inherit from base class
    super(options);
  }
}

module.exports = DisneylandParisWaltDisneyStudios;
