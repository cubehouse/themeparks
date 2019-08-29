// import the base Busch Gardens class
const BuschGardensBase = require("./buschgardensparkbase");

/**
 * BuschGardensTampa
 * @class
 * @extends SeaworldBase
 */
class BuschGardensTampa extends BuschGardensBase {
  /**
   * Create a new BuschGardensTampa object
   */
  constructor(options = {}) {
    options.name = options.name || "Busch Gardens Tampa";
    options.timezone = options.timezone || "America/New_York";

    // set resort's general center point
    options.latitude = options.latitude || 28.038092;
    options.longitude = options.longitude || -82.421583;

    options.parkID = "tampa";
    options.calendarID = "01d7932a-e537-476b-b658-e3e4b7f6677f";

    // inherit from base class
    super(options);
  }
}

module.exports = BuschGardensTampa;
