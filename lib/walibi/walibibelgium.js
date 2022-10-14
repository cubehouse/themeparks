const Walibi = require('./walibi');

/**
 * Walibi Belgium
 * @class
 * @extends Walibi
 */
class WalibiBelgium extends Walibi {
  /**
   * Create a new WalibiBelgium object
   */
  constructor(options = {}) {
    options.name = options.name || 'Walibi Belgium';
    options.timezone = options.timezone || 'Europe/Brussels';
    options.useragent = 'okhttp/3.9.1';

    // set park's location as it's entrance
    options.latitude = options.latitude || 50.701862579254744;
    options.longitude = options.longitude || 4.593853329221812;

    // Park API options
    options.waitTimesURL = 'https://www.walibi.be/en/api/waiting_time?_format=json';
    options.calendarURL = `https://www.walibi.be/en/api/calendar/${year}?_format=json`;

    // inherit from base class
    super(options);
  }
}

module.exports = WalibiBelgium;
