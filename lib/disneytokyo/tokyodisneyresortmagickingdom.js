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
    options.name = options.name || 'Magic Kingdom - Tokyo Disney Resort';
    options.timezone = options.timezone || 'Asia/Tokyo';

    // set park's location as it's entrance
    options.latitude = options.latitude || 35.634848;
    options.longitude = options.longitude || 139.879295;

    // Magic Kingdom Park ID
    options.parkId = options.parkId || 'tdl';
    options.parkKind = options.parkKind || 1;

    options.fallbackEnglishNames = {
      151: {
        name: 'Omnibus',
        area: 'World Bazaar',
      },
      152: {
        name: 'Pirates of the Caribbean',
        area: 'Adventureland',
      },
      153: {
        name: 'Jungle Cruise: Wildlife Expeditions',
        area: 'Adventureland',
      },
      154: {
        name: 'Western River Railroad',
        area: 'Adventureland',
      },
      155: {
        name: 'Swiss Family Treehouse',
        area: 'Adventureland',
      },
      156: {
        name: 'The Enchanted Tiki Room: Stitch Presents "Aloha E Komo Mai!"',
        area: 'Adventureland',
      },
      157: {
        name: 'Westernland Shootin\' Gallery',
        area: 'Westernland',
      },
      158: {
        name: 'Country Bear Theater',
        area: 'Westernland',
      },
      159: {
        name: 'Mark Twain Riverboat',
        area: 'Westernland',
      },
      160: {
        name: 'Big Thunder Mountain',
        area: 'Westernland',
      },
      161: {
        name: 'Tom Sawyer Island Rafts',
        area: 'Westernland',
      },
      162: {
        name: 'Splash Mountain',
        area: 'Critter Country',
      },
      163: {
        name: 'Beaver Brothers Explorer Canoes',
        area: 'Critter Country',
      },
      164: {
        name: 'Peter Pan\'s Flight',
        area: 'Fantasyland',
      },
      165: {
        name: 'Snow White\'s Adventures',
        area: 'Fantasyland',
      },
      166: {
        name: 'Cinderella\'s Fairy Tale Hall',
        area: 'Fantasyland',
      },
      167: {
        name: 'Mickey\'s PhilharMagic',
        area: 'Fantasyland',
      },
      168: {
        name: 'Pinocchio\'s Daring Journey',
        area: 'Fantasyland',
      },
      169: {
        name: 'Dumbo The Flying Elephant',
        area: 'Fantasyland',
      },
      170: {
        name: 'Castle Carrousel',
        area: 'Fantasyland',
      },
      171: {
        name: 'Haunted Mansion',
        area: 'Fantasyland',
      },
      172: {
        name: '"it\'s a small world"',
        area: 'Fantasyland',
      },
      173: {
        name: 'Alice\'s Tea Party',
        area: 'Fantasyland',
      },
      174: {
        name: 'Pooh\'s Hunny Hunt',
        area: 'Fantasyland',
      },
      175: {
        name: 'Roger Rabbit\'s Car Toon Spin',
        area: 'Toontown',
      },
      176: {
        name: 'Minnie\'s House',
        area: 'Toontown',
      },
      178: {
        name: 'Chip \'n Dale\'s Treehouse',
        area: 'Toontown',
      },
      179: {
        name: 'Gadget\'s Go Coaster',
        area: 'Toontown',
      },
      180: {
        name: 'Donald\'s Boat',
        area: 'Toontown',
      },
      181: {
        name: 'Goofy\'s Paint \'n\' Play House',
        area: 'Toontown',
      },
      183: {
        name: 'Star Tours: The Adventures Continue',
        area: 'Tomorrowland',
      },
      184: {
        name: 'Space Mountain',
        area: 'Tomorrowland',
      },
      185: {
        name: 'Buzz Lightyear\'s Astro Blasters',
        area: 'Tomorrowland',
      },
      189: {
        name: 'Monsters, Inc. Ride & Go Seek!',
        area: 'Tomorrowland',
      },
      191: {
        name: 'Penny Arcade',
        area: 'World Bazaar',
      },
      194: {
        name: 'Toon Park',
        area: 'Toontown',
      },
      195: {
        name: 'Stitch Encounter',
        area: 'Tomorrowland',
      },
    };

    // inherit from base class
    super(options);
  }
}

module.exports = TokyoDisneyResortMagicKingdom;
