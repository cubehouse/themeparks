const Walibi = require('./walibi');

/**
 * Walibi Rhone Alpes
 * @class
 * @extends Walibi
 */
class WalibiRhoneAlpes extends Walibi {
  /**
   * Create a new WalibiRhoneAlpes object
   */
  constructor(options = {}) {
    const year = new Date().getFullYear();

    options.name = options.name || 'Walibi Rhône-Alpes';
    options.timezone = options.timezone || 'Europe/Paris';
    options.useragent = 'okhttp/3.9.1';

    // set park's location as it's entrance
    options.latitude = options.latitude || 45.62019849592855;
    options.longitude = options.longitude || 5.569157211206305;

    // Park API options
    options.waitTimesURL = 'https://www.walibi.fr/en/api/waiting_time?_format=json';
    options.calendarURL = `https://www.walibi.fr/en/api/calendar/${year}?_format=json`;

    // inherit from base class
    super(options);
  }
}

module.exports = WalibiRhoneAlpes;
