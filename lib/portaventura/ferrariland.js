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

    options.parkCalendarURL = options.parkCalendarURL || 'https://www.portaventuraworld.com/static/d/8/path---ferrari-land-horarios-calendario-e-99-361-Z1gopUSwmTXY8uEZGAM4LcPRA.json';

    super(options);
  }
}

module.exports = FerrariLand;
