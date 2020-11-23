const HostedPark = require('../hostedPark');

/**
 * Disneyland Resort California Adventure
 * @class
 * @extends DisneyBase
 */
class DisneylandResortCaliforniaAdventure extends HostedPark {
  /**
   * Create a new DisneylandResortCaliforniaAdventure object
   */
  constructor(options = {}) {
    options.name = options.name || 'California Adventure - Disneyland Resort';
    options.timezone = options.timezone || 'America/Los_Angeles';

    // set park's location as it's entrance
    options.latitude = options.latitude || 33.808720;
    options.longitude = options.longitude || -117.918990;

    // inherit from base class
    super(options);
  }
}

module.exports = DisneylandResortCaliforniaAdventure;
