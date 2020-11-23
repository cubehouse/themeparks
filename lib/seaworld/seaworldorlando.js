// import the base Seaworld class
const SeaworldBase = require('./seaworldparkbase');

/**
 * SeaworldOrlando
 * @class
 * @extends SeaworldBase
 */
class SeaworldOrlando extends SeaworldBase {
  /**
   * Create a new SeaworldOrlando object
   */
  constructor(options = {}) {
    options.name = options.name || 'Seaworld Orlando';
    options.timezone = options.timezone || 'America/New_York';

    // set resort's general center point
    options.latitude = options.latitude || 28.4115;
    options.longitude = options.longitude || -81.4634;

    options.parkID = 'orlando';
    options.calendarID = '01d7932a-e537-476b-b658-e3e4b7f6677f';
    options.siteHost = 'seaworld.com';
    options.brand = 'seaworld';

    // inherit from base class
    super(options);
  }
}

module.exports = SeaworldOrlando;
