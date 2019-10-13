// import the base Busch Gardens class
const BuschGardensBase = require('./buschgardensparkbase.js');

/**
 * Busch Gardens Williamsburg - Currently not reporting wait times
 * @class
 * @extends BuschGardensBase
 */
class BuschGardensWilliamsburg extends BuschGardensBase {
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

    super(options);
  }
}

module.exports = BuschGardensWilliamsburg;
