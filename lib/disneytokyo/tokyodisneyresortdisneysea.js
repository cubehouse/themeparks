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
    options.name = options.name || 'Disney Sea - Tokyo Disney Resort';
    options.timezone = options.timezone || 'Asia/Tokyo';

    // set park's location as it's entrance
    options.latitude = options.latitude || 35.627055;
    options.longitude = options.longitude || 139.889097;

    // Magic Kingdom Park ID
    options.parkId = options.parkId || 'tds';
    options.parkKind = options.parkKind || 2;

    options.fallbackEnglishNames = {
      202: {
        name: 'Ariel\'s Playground',
        area: 'Mermaid Lagoon',
      },
      218: {
        name: 'Toy Story Mania!',
        area: 'American Waterfront',
      },
      219: {
        name: 'Soarin: Fantastic Flight',
        area: 'Mediterranean Harbor',
      },
      220: {
        name: 'Jasmine\'s Flying Carpets',
        area: 'Arabian Coast',
      },
      221: {
        name: 'Mermaid Lagoon Theater (King Triton\'s Concert)',
        area: 'Mermaid Lagoon',
      },
      222: {
        name: 'Indiana Jones® Adventure: Temple of the Crystal Skull',
        area: 'Lost River Delta',
      },
      223: {
        name: 'Journey to the Center of the Earth',
        area: 'Mysterious Island',
      },
      224: {
        name: '20,000 Leagues Under the Sea',
        area: 'Mysterious Island',
      },
      226: {
        name: 'The Magic Lamp Theater',
        area: 'Arabian Coast',
      },
      227: {
        name: 'Mediterranean Harbor DisneySea Transit Steamer Line',
        area: 'Mediterranean Harbor',
      },
      228: {
        name: 'American Waterfront DisneySea Transit Steamer Line',
        area: 'American Waterfront',
      },
      229: {
        name: 'Lost River Delta DisneySea Transit Steamer Line',
        area: 'Lost River Delta',
      },
      230: {
        name: 'Venetian Gondolas',
        area: 'Mediterranean Harbor',
      },
      231: {
        name: 'Port Discovery DisneySea Electric Railway',
        area: 'Port Discovery',
      },
      232: {
        name: 'American Waterfront DisneySea Electric Railway',
        area: 'American Waterfront',
      },
      233: {
        name: 'Big City Vehicles',
        area: 'American Waterfront',
      },
      234: {
        name: 'Aquatopia',
        area: 'Port Discovery',
      },
      235: {
        name: 'Sindbad\'s Storybook Voyage',
        area: 'Arabian Coast',
      },
      236: {
        name: 'Caravan Carousel',
        area: 'Arabian Coast',
      },
      237: {
        name: 'Flounder\'s Flying Fish Coaster',
        area: 'Mermaid Lagoon',
      },
      238: {
        name: 'Scuttle\'s Scooters',
        area: 'Mermaid Lagoon',
      },
      239: {
        name: 'Jumpin\' Jellyfish',
        area: 'Mermaid Lagoon',
      },
      240: {
        name: 'Blowfish Balloon Race',
        area: 'Mermaid Lagoon',
      },
      241: {
        name: 'The Whirlpool',
        area: 'Mermaid Lagoon',
      },
      242: {
        name: 'Raging Spirits',
        area: 'Lost River Delta',
      },
      243: {
        name: ' Tower of Terror',
        area: 'American Waterfront',
      },
      244: {
        name: 'Fortress Explorations',
        area: 'Mediterranean Harbor',
      },
      245: {
        name: 'Fortress Explorations',
        area: 'Mediterranean Harbor',
      },
      246: {
        name: 'Turtle Talk',
        area: 'American Waterfront',
      },
      247: {
        name: 'Nemo & Friends SeaRider',
        area: 'Port Discovery',
      },
    };

    // inherit from base class
    super(options);
  }
}

module.exports = TokyoDisneyResortDisneySea;
