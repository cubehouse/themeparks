// import the base Disney park class
const DisneyLegacy = require('./disneylegacyapi.js');

/**
 * Disneyland Paris Magic Kingdom
 * @class
 * @extends DisneyBase
 */
class DisneylandParisMagicKingdom extends DisneyLegacy {
  /**
   * Create a new DisneylandParisMagicKingdom object
   */
  constructor(options = {}) {
    options.name = options.name || 'Disneyland Paris - Magic Kingdom';
    options.timezone = options.timezone || 'Europe/Paris';

    // set park's location as it's entrance
    options.latitude = options.latitude || 48.870321;
    options.longitude = options.longitude || 2.779672;

    // Disney API configuration for Disneyland Paris Magic Kingdom
    options.resortId = options.resortId || 'dlp';
    options.parkId = options.parkId || 'P1';
    options.resortRegion = options.resortRegion || 'fr';
    options.resortCode = options.resortCode || 'dlp';

    // inherit from base class
    super(options);
  }
}

module.exports = DisneylandParisMagicKingdom;
