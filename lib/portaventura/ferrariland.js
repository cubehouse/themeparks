const Portaventura = require('./portaventura');

/**
 * Implements the Ferrari Land Park.
 * @class
 * @extends Portaventura
 */
class FerrariLand extends Portaventura {
  /**
   * Create new FerrariLand Object.
   */
  constructor(options = {}) {
    options.name = options.name || 'Ferrari Land';

    options.parkTitle = options.parkTitle || 'ferrari-land';
    options.parkID = options.parkID || '1';

    options.latitude = options.latitude || 41.086132;
    options.longitude = options.longitude || 1.153243;

    options.parkCalendarURL = options.parkCalendarURL || 'https://www.portaventuraworld.com/page-data/en/ferrari-land/dates-times/page-data.json';

    super(options);
  }
}

module.exports = FerrariLand;
