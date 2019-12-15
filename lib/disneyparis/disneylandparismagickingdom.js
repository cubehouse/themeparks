// import the base Disney Paris park class
const DisneyParis = require('./disneyparisbase.js');

/**
 * Disneyland Paris - Magic Kingdom
 * @class
 * @extends DisneyBase
 */
class DisneylandParisMagicKingdom extends DisneyParis {
  /**
   * Create a new DisneylandParisMagicKingdom object
   */
  constructor(options = {}) {
    options.name = options.name || 'Magic Kingdom - Disneyland Paris';
    options.timezone = options.timezone || 'Europe/Paris';

    // set park's location as it's entrance
    options.latitude = options.latitude || 48.870321;
    options.longitude = options.longitude || 2.779672;

    // Disney API configuration for Disneyland Paris Magic Kingdom
    options.parkId = options.parkId || 'P1';
    options.lang = options.lang || 'en-gb';

    // inherit from base class
    super(options);
  }
}

module.exports = DisneylandParisMagicKingdom;
