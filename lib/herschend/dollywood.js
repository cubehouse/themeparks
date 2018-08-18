// import the base Herschend class
const HerschendBase = require('./herschendparkbase');

/**
 * Dollywood
 * @class
 * @extends HerschendBase
 */
class Dollywood extends HerschendBase {
  /**
   * Create a new Dollywood object
   */
  constructor(options = {}) {
    options.name = options.name || 'Dollywood';
    options.timezone = options.timezone || 'America/New_York';

    // set resort's general center point
    options.latitude = options.latitude || 35.795329;
    options.longitude = options.longitude || -83.530886;

    options.parkID = 1;
    options.calendarUrl = 'www.dollywood.com';
    options.parkIDs = 'B31C52D1-0BDE-4494-BAC9-C843C8F25942';

    // inherit from base class
    super(options);
  }
}

module.exports = Dollywood;
