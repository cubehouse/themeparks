const DisneyTokyoPark = require('./disneyTokyoBase');

/**
 * Tokyo Disney Resort - Disney Sea
 * @class
 * @extends DisneyTokyoPark
 */
class TokyoDisneyResortDisneySea extends DisneyTokyoPark {
  /**
   * Create a new TokyoDisneyResortDisneySea object
   */
  constructor(options = {}) {
    options.name = options.name || 'Tokyo Disney Resort - Disney Sea';
    options.timezone = options.timezone || 'Asia/Tokyo';

    // set park's location as it's entrance
    options.latitude = options.latitude || 35.627055;
    options.longitude = options.longitude || 139.889097;

    // Magic Kingdom Park ID
    options.parkId = options.parkId || 'tds';
    options.parkKind = options.parkKind || 2;

    // inherit from base class
    super(options);
  }
}

module.exports = TokyoDisneyResortDisneySea;
