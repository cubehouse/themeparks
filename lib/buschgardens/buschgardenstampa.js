// import the base Busch Gardens class
const BuschGardensBase = require('./buschgardensparkbase.js');

/**
 * Busch Gardens Tampa
 * @class
 * @extends BuschGardensBase
 */
class BuschGardensTampa extends BuschGardensBase {
  /**
     * Create a new Busch Gardens Tampa object
     */
  constructor(options = {}) {
    options.name = options.name || 'Busch Gardens Tampa';
    options.timezone = options.timezone || 'America/New_York';

    options.latitude = options.latitude || 28.037112;
    options.longitude = options.longitude || -82.419604;

    options.parkID = 'tampa';
    options.calendarID = 'e8f949ea-6d1f-4644-b771-45c18d2cd5b4';

    super(options);
  }
}

module.exports = BuschGardensTampa;
