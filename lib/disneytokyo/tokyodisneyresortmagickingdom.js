const DisneyTokyoPark = require('./disneyTokyoBase');

/**
 * Tokyo Disney Resort - Magic Kingdom
 * @class
 * @extends DisneyTokyoPark
 */
class TokyoDisneyResortMagicKingdom extends DisneyTokyoPark {
  /**
   * Create a new TokyoDisneyResortMagicKingdom object
   */
  constructor(options = {}) {
    options.name = options.name || 'Tokyo Disney Resort - Magic Kingdom';
    options.timezone = options.timezone || 'Asia/Tokyo';

    // set park's location as it's entrance
    options.latitude = options.latitude || 35.634848;
    options.longitude = options.longitude || 139.879295;

    // Magic Kingdom Park ID
    options.parkId = options.parkId || 'tdl';
    options.parkKind = options.parkKind || 1;

    // inherit from base class
    super(options);
  }
}

module.exports = TokyoDisneyResortMagicKingdom;
