const fs = require('fs');
const path = require('path');

const parks = {
  WaltDisneyWorldMagicKingdom: {
    name: 'Walt Disney World - Magic Kingdom',
    entityId: '75ea578a-adc8-4116-a54d-dccb60765ef9',
  },
  WaltDisneyWorldEpcot: {
    name: 'Walt Disney World - Epcot',
    entityId: '47f90d2c-e191-4239-a466-5892ef59a88b',
  },
  WaltDisneyWorldHollywoodStudios: {
    name: 'Walt Disney World - Hollywood Studios',
    entityId: '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
  },
  WaltDisneyWorldAnimalKingdom: {
    name: 'Walt Disney World - Animal Kingdom',
    entityId: '1c84a229-8862-4648-9c71-378ddd2c7693',
  },
  DisneylandResortMagicKingdom: {
    name: 'Disneyland Resort - Magic Kingdom',
    entityId: '7340550b-c14d-4def-80bb-acdb51d49a66',
  },
  DisneylandResortCaliforniaAdventure: {
    name: 'Disneyland Resort - California Adventure',
    entityId: '832fcd51-ea19-4e77-85c7-75d5843b127c',
  },
  DisneylandParisMagicKingdom: {
    name: 'Disneyland Paris - Magic Kingdom',
    entityId: 'dae968d5-630d-4719-8b06-3d107e944401',
  },
  DisneylandParisWaltDisneyStudios: {
    name: 'Disneyland Paris - Walt Disney Studios',
    entityId: 'ca888437-ebb4-4d50-aed2-d227f7096968',
  },
  HongKongDisneyland: {
    name: 'Hong Kong Disneyland',
    entityId: 'bd0eb47b-2f02-4d4d-90fa-cb3a68988e3b',
  },
  ShanghaiDisneyResortMagicKingdom: {
    name: 'Shanghai Disney Resort - Magic Kingdom',
    entityId: 'ddc4357c-c148-4b36-9888-07894fe75e83',
  },
  TokyoDisneyResortMagicKingdom: {
    name: 'Tokyo Disney Resort - Magic Kingdom',
    entityId: '3cc919f1-d16d-43e0-8c3f-1dd269bd1a42',
  },
  TokyoDisneyResortDisneySea: {
    name: 'Tokyo Disney Resort - DisneySea',
    entityId: '67b290d5-3478-4f23-b601-2f8fb71ba803',
  },
  EuropaPark: {
    name: 'Europa-Park',
    entityId: '639738d3-9574-4f60-ab5b-4c392901320b',
  },
  HersheyPark: {
    name: 'Hersheypark',
    entityId: '0f044655-cd94-4bb8-a8e3-c789f4eca787',
  },
  AsterixPark: {
    name: 'Parc Asterix',
    entityId: '6cc48df2-f126-4f28-905d-b4c2c15765f2',
  },
  CaliforniasGreatAmerica: {
    name: 'California\\\'s Great America',
    entityId: 'bdf9b533-144c-4b78-aa2f-5173c5ce5e85',
  },
  CanadasWonderland: {
    name: 'Canada\\\'s Wonderland',
    entityId: '66f5d97a-a530-40bf-a712-a6317c96b06d',
  },
  Carowinds: {
    name: 'Carowinds',
    entityId: '24cdcaa8-0500-4340-9725-992865eb18d6',
  },
  CedarPoint: {
    name: 'CedarPoint',
    entityId: 'c8299e1a-0098-4677-8ead-dd0da204f8dc',
  },
  KingsIsland: {
    name: 'King\\\'s Island',
    entityId: 'a0df8d87-7f72-4545-a58d-eb8aa76f914b',
  },
  KnottsBerryFarm: {
    name: 'Knott\\\'s Berry Farm',
    entityId: '0a6123bb-1e8c-4b18-a2d3-2696cf2451f5',
  },
  Dollywood: {
    name: 'Dollywood',
    entityId: '7502308a-de08-41a3-b997-961f8275ab3c',
  },
  SilverDollarCity: {
    name: 'Silver Dollar City',
    entityId: 'd21fac4f-1099-4461-849c-0f8e0d6e85a6',
  },
  SeaworldOrlando: {
    name: 'Seaworld Orlando',
    entityId: '27d64dee-d85e-48dc-ad6d-8077445cd946',
  },
  Efteling: {
    name: 'Efteling',
    entityId: '30713cf6-69a9-47c9-a505-52bb965f01be',
  },
  UniversalStudiosFlorida: {
    name: 'Universal Studios Florida',
    entityId: 'eb3f4560-2383-4a36-9152-6b3e5ed6bc57',
  },
  UniversalIslandsOfAdventure: {
    name: 'Universal\\\'s Islands Of Adventure',
    entityId: '267615cc-8943-4c2a-ae2c-5da728ca591f',
  },
  UniversalVolcanoBay: {
    name: 'Universal\\\'s Volcano Bay',
    entityId: 'fe78a026-b91b-470c-b906-9d2266b692da',
  },
  UniversalStudiosHollywood: {
    name: 'Universal Studios Hollywood',
    entityId: 'bc4005c5-8c7e-41d7-b349-cdddf1796427',
  },
  // UniversalStudiosSingapore: {
  //     name: 'UniversalStudiosSingapore',
  //     entityId: 'UniversalStudiosSingapore',
  // },
  // UniversalStudiosJapan: {
  //     name: 'UniversalStudiosJapan',
  //     entityId: 'UniversalStudiosJapan',
  // },
  SixFlagsOverTexas: {
    name: 'SixFlagsOverTexas',
    entityId: '4535960b-45fb-49fb-a38a-59cf602a0a9c',
  },
  SixFlagsOverGeorgia: {
    name: 'SixFlagsOverGeorgia',
    entityId: '0c7ab128-259a-4390-93b9-d2e0233dfc16',
  },
  SixFlagsStLouis: {
    name: 'SixFlagsStLouis',
    entityId: '815e6367-9bbe-449e-a639-a093e216188f',
  },
  SixFlagsGreatAdventure: {
    name: 'SixFlagsGreatAdventure',
    entityId: '556f0126-8082-4b66-aeee-1e3593fed188',
  },
  SixFlagsMagicMountain: {
    name: 'SixFlagsMagicMountain',
    entityId: 'c6073ab0-83aa-4e25-8d60-12c8f25684bc',
  },
  SixFlagsGreatAmerica: {
    name: 'SixFlagsGreatAmerica',
    entityId: '15805a4d-4023-4702-b9f2-3d3cab2e0c1e',
  },
  SixFlagsFiestaTexas: {
    name: 'SixFlagsFiestaTexas',
    entityId: '8be1e984-1e5f-40d0-a750-ce8e4dc2e87c',
  },
  // SixFlagsHurricaneHarborArlington: {
  //     name: 'SixFlagsHurricaneHarborArlington',
  //     entityId: 'SixFlagsHurricaneHarborArlington',
  // },
  // SixFlagsHurricaneHarborLosAngeles: {
  //     name: 'SixFlagsHurricaneHarborLosAngeles',
  //     entityId: 'SixFlagsHurricaneHarborLosAngeles',
  // },
  SixFlagsAmerica: {
    name: 'SixFlagsAmerica',
    entityId: 'd4c88416-3361-494d-8905-23a83e9cb091',
  },
  SixFlagsDiscoveryKingdom: {
    name: 'SixFlagsDiscoveryKingdom',
    entityId: '3237a0c2-8e35-4a1c-9356-a319d5988e7c',
  },
  SixFlagsNewEngland: {
    name: 'SixFlagsNewEngland',
    entityId: 'd553882d-5316-4fca-9530-cc898258aec0',
  },
  // SixFlagsHurricaneHarborJackson: {
  //     name: 'SixFlagsHurricaneHarborJackson',
  //     entityId: 'SixFlagsHurricaneHarborJackson',
  // },
  TheGreatEscape: {
    name: 'TheGreatEscape',
    entityId: '000c724a-cd0f-41a1-b355-f764902c2b55',
  },
  // SixFlagsWhiteWaterAtlanta: {
  //     name: 'SixFlagsWhiteWaterAtlanta',
  //     entityId: 'SixFlagsWhiteWaterAtlanta',
  // },
  SixFlagsMexico: {
    name: 'SixFlagsMexico',
    entityId: 'd67e40f9-9c02-4bfe-8ee1-b714deda9906',
  },
  LaRondeMontreal: {
    name: 'LaRondeMontreal',
    entityId: 'd2bef7bc-f9fc-4272-a6f1-2539d7413911',
  },
  // SixFlagsHurricaneHarborOaxtepec: {
  //     name: 'SixFlagsHurricaneHarborOaxtepec',
  //     entityId: 'SixFlagsHurricaneHarborOaxtepec',
  // },
  // SixFlagsHurricaneHarborConcord: {
  //     name: 'SixFlagsHurricaneHarborConcord',
  //     entityId: 'SixFlagsHurricaneHarborConcord',
  // },
  PortAventura: {
    name: 'PortAventura',
    entityId: '32608bdc-b3fa-478e-a8c0-9dde197a4212',
  },
  FerrariLand: {
    name: 'Ferrari Land',
    entityId: 'd06d91b8-7702-42c3-a8af-7d0161d471bf',
  },
  AltonTowers: {
    name: 'Alton Towers',
    entityId: '0d8ea921-37b1-4a9a-b8ef-5b45afea847b',
  },
  ThorpePark: {
    name: 'Thorpe Park',
    entityId: 'b08d9272-d070-4580-9fcd-375270b191a7',
  },
  ChessingtonWorldOfAdventures: {
    name: 'Chessington World Of Adventures',
    entityId: 'ae959d1f-9fcc-4aab-8063-71e641fa57f4',
  },
  Bellewaerde: {
    name: 'Bellewaerde',
    entityId: '164f3ee7-5fd7-47ac-addc-40b5e3e2b144',
  },
  Phantasialand: {
    name: 'Phantasialand',
    entityId: 'abb67808-61e3-49ef-996c-1b97ed64fac6',
  },
  HeidePark: {
    name: 'Heide Park',
    entityId: '66e12a41-3a09-40cd-8f55-8d335d9d7d93',
  },
  BuschGardensTampa: {
    name: 'Busch Gardens Tampa',
    entityId: 'fc40c99a-be0a-42f4-a483-1e939db275c2',
  },
  BuschGardensWilliamsburg: {
    name: 'Busch Gardens Williamsburg',
    entityId: '98f634cd-c388-439c-b309-960f9475b84d',
  },
  Liseberg: {
    name: 'Liseberg',
    entityId: '93142d7e-024a-4877-9c72-f8e904a37c0c',
  },
  Toverland: {
    name: 'Toverland',
    entityId: 'f4bd1a23-44f0-444b-a91c-8d24f6ec5b1f',
  },
};

function GenerateParkObjects() {
  const fileHeader = `// auto-generated file, do not edit
exports.Settings = {}; // dummy object for backwards compatibility
const BaseParkObject = require('./themeparkswiki');\n\n`;

  const parkKeys = Object.keys(parks);
  const parkObjects = [];
  parkKeys.forEach((park) => {
    parkObjects.push(`/**
    * Implements the ${parks[park].name} API.
    * @class
    * @extends ThemeParksWikiPark
    */
    class ${park} extends BaseParkObject {
    constructor() {
        super({
            name: '${parks[park].name}',
            entityId: '${parks[park].entityId}',
        });
    }
}`);
  });
  return `${fileHeader + parkObjects.join('\n')}\n
/**
 * Array of all Theme Park Objects
 * @type {ThemeParksWikiPark[]}
 **/
exports.AllParks = [\n${parkKeys.join(',\n')},\n];
/**
 * Object of all Theme Park Objects
 * @type {Object.<string, ThemeParksWikiPark>}
 **/
exports.Parks = {\n${parkKeys.join(',\n')},\n};
`;
}

const indexTxt = GenerateParkObjects();

// get current script directory
const scriptDir = path.dirname(fs.realpathSync(__filename));

fs.writeFileSync(`${scriptDir}/lib/index.js`, indexTxt);
