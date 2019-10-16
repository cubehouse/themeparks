// import the base Busch Gardens class
const SeaWorldBase = require('./seaworldparkbase');

/**
 * Busch Gardens Williamsburg - Currently not reporting wait times
 * @class
 * @extends SeaWorldBase
 */
class BuschGardensWilliamsburg extends SeaWorldBase {
  /**
     * Create a new Busch Gardens Williamsburg object
     */
  constructor(options = {}) {
    options.name = options.name || 'Busch Gardens Williamsburg';
    options.timezone = options.timezone || 'America/New_York';

    options.latitude = options.latitude || 37.3028205;
    options.longitude = options.longitude || -76.9880439;

    options.parkID = 'williamsburg';
    options.calendarID = 'c92c0499-dd8d-42e2-b34a-d69c158f16a0';
    options.siteHost = 'buschgardens.com';
    options.brand = 'buschgardens';

    super(options);
  }
}

module.exports = BuschGardensWilliamsburg;
