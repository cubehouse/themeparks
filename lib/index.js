// expose Settings object to allow overriding of some basic defaults
exports.Settings = require('./settings');

// === Include Park Libs ===

// Walt Disney World Resort
const WaltDisneyWorldMagicKingdom = require('./disney/waltdisneyworldmagickingdom');
const WaltDisneyWorldEpcot = require('./disney/waltdisneyworldepcot');
const WaltDisneyWorldHollywoodStudios = require('./disney/waltdisneyworldhollywoodstudios');
const WaltDisneyWorldAnimalKingdom = require('./disney/waltdisneyworldanimalkingdom');
// Disneyland Resort
const DisneylandResortMagicKingdom = require('./disney/disneylandresortmagickingdom');
const DisneylandResortCaliforniaAdventure = require('./disney/disneylandresortcaliforniaadventure');
// Disneyland Paris
const DisneylandParisMagicKingdom = require('./disney/disneylandparismagickingdom');
const DisneylandParisWaltDisneyStudios = require('./disney/disneylandpariswaltdisneystudios');
// Hong Kong Disneyland
const HongKongDisneyland = require('./disney/hongkongdisneyland');
// Shanghai Disneyland
const ShanghaiDisneyResortMagicKingdom = require('./disney/shanghaidisneyresort');
// Tokyo Disney Resort
const TokyoDisneyResortMagicKingdom = require('./disneytokyo/tokyodisneyresortmagickingdom');
const TokyoDisneyResortDisneySea = require('./disneytokyo/tokyodisneyresortdisneysea');
// Europa
const EuropaPark = require('./europapark/europapark');
// Parc Asterix
const AsterixPark = require('./asterixpark/asterixpark');
// Cedar Fair Parks
const CaliforniasGreatAmerica = require('./cedarfair/californiasgreatamerica');
const CanadasWonderland = require('./cedarfair/canadaswonderland');
const Carowinds = require('./cedarfair/carowinds');
const CedarPoint = require('./cedarfair/cedarpoint');
const KingsIsland = require('./cedarfair/kingsisland');
const KnottsBerryFarm = require('./cedarfair/knottsberryfarm');
// Herschend Parks
const Dollywood = require('./herschend/dollywood');
const SilverDollarCity = require('./herschend/silverdollarcity');
// Seaworld
const SeaworldOrlando = require('./seaworld/seaworldorlando');
// Efteling
const Efteling = require('./efteling/eftelingpark');
// Hersheypark
const HersheyPark = require('./hersheys/hersheyspark');
// Universal Florida
const UniversalStudiosFlorida = require('./universal/universalstudiosflorida');
const UniversalIslandsOfAdventure = require('./universal/universalislandsofadventure');
const UniversalVolcanoBay = require('./universal/universalvolcanobay');
// Universal Hollywood
const UniversalStudiosHollywood = require('./universal/universalstudioshollywood');
// Universal Studios Singapore
const UniversalStudiosSingapore = require('./universal/universalstudiossingapore');
// Six Flags Parks
const SixFlagsOverTexas = require('./sixflags/sixflagsovertexas');
const SixFlagsOverGeorgia = require('./sixflags/sixflagsovergeorgia');
const SixFlagsStLouis = require('./sixflags/sixflagsstlouis');
const SixFlagsGreatAdventure = require('./sixflags/sixflagsgreatadventure');
const SixFlagsMagicMountain = require('./sixflags/sixflagsmagicmountain');
const SixFlagsGreatAmerica = require('./sixflags/sixflagsgreatamerica');
const SixFlagsFiestaTexas = require('./sixflags/sixflagsfiestatexas');
const SixFlagsHurricaneHarborArlington = require('./sixflags/sixflagshurricaneharborarlington');
const SixFlagsHurricaneHarborLosAngeles = require('./sixflags/sixflagshurricaneharborlosangeles');
const SixFlagsAmerica = require('./sixflags/sixflagsamerica');
const SixFlagsDiscoveryKingdom = require('./sixflags/sixflagsdiscoverykingdom');
const SixFlagsNewEngland = require('./sixflags/sixflagsnewengland');
const SixFlagsHurricaneHarborJackson = require('./sixflags/sixflagshurricaneharborjackson');
const TheGreatEscape = require('./sixflags/thegreatescape');
const SixFlagsWhiteWaterAtlanta = require('./sixflags/sixflagswhitewateratlanta');
const SixFlagsMexico = require('./sixflags/sixflagsmexico');
const LaRondeMontreal = require('./sixflags/larondemontreal');
const SixFlagsHurricaneHarborOaxtepec = require('./sixflags/sixflagshurricaneharboroaxtepec');
const SixFlagsHurricaneHarborConcord = require('./sixflags/sixflagshurricaneharborconcord');

// === Expose Parks ===

// Array of available theme parks in the API
//  we manually add each one of these as any nice IDEs that "intellisense" will pick them up :)
exports.AllParks = [
  // Walt Disney World Resort
  WaltDisneyWorldMagicKingdom,
  WaltDisneyWorldEpcot,
  WaltDisneyWorldHollywoodStudios,
  WaltDisneyWorldAnimalKingdom,
  // Disneyland Resort
  DisneylandResortMagicKingdom,
  DisneylandResortCaliforniaAdventure,
  // Disneyland Paris
  DisneylandParisMagicKingdom,
  DisneylandParisWaltDisneyStudios,
  // Hong Kong Disneyland
  HongKongDisneyland,
  // Shanghai Disneyland
  ShanghaiDisneyResortMagicKingdom,
  // Tokyo Disney Resort
  TokyoDisneyResortMagicKingdom,
  TokyoDisneyResortDisneySea,
  // Europa
  EuropaPark,
  // Asterix Park
  AsterixPark,
  // Cedar Fair Parks
  CaliforniasGreatAmerica,
  CanadasWonderland,
  Carowinds,
  CedarPoint,
  KingsIsland,
  KnottsBerryFarm,
  // Herschend Parks,
  Dollywood,
  SilverDollarCity,
  // Seaworld
  SeaworldOrlando,
  // Efteling
  Efteling,
  // Herysheypark
  HersheyPark,
  // Universal Florida
  UniversalStudiosFlorida,
  UniversalIslandsOfAdventure,
  UniversalVolcanoBay,
  // Universal Hollywood
  UniversalStudiosHollywood,
  // Universal Studios Singapore
  UniversalStudiosSingapore,
  // Six Flags Parks
  SixFlagsOverTexas,
  SixFlagsOverGeorgia,
  SixFlagsStLouis,
  SixFlagsGreatAdventure,
  SixFlagsMagicMountain,
  SixFlagsGreatAmerica,
  SixFlagsFiestaTexas,
  SixFlagsHurricaneHarborArlington,
  SixFlagsHurricaneHarborLosAngeles,
  SixFlagsAmerica,
  SixFlagsDiscoveryKingdom,
  SixFlagsNewEngland,
  SixFlagsHurricaneHarborJackson,
  TheGreatEscape,
  SixFlagsWhiteWaterAtlanta,
  SixFlagsMexico,
  LaRondeMontreal,
  SixFlagsHurricaneHarborOaxtepec,
  SixFlagsHurricaneHarborConcord,
];

// export all parks by name in a JavaScript object too
exports.Parks = {
  // Walt Disney World Resort
  WaltDisneyWorldMagicKingdom,
  WaltDisneyWorldEpcot,
  WaltDisneyWorldHollywoodStudios,
  WaltDisneyWorldAnimalKingdom,
  // Disneyland Resort
  DisneylandResortMagicKingdom,
  DisneylandResortCaliforniaAdventure,
  // Disneyland Paris
  DisneylandParisMagicKingdom,
  DisneylandParisWaltDisneyStudios,
  // Hong Kong Disneyland
  HongKongDisneyland,
  // Shanghai Disneyland
  ShanghaiDisneyResortMagicKingdom,
  // Tokyo Disney Resort
  TokyoDisneyResortMagicKingdom,
  TokyoDisneyResortDisneySea,
  // Europa
  EuropaPark,
  // Herysheypark
  HersheyPark,
  // Asterix Park
  AsterixPark,
  // Cedar Fair Parks
  CaliforniasGreatAmerica,
  CanadasWonderland,
  Carowinds,
  CedarPoint,
  KingsIsland,
  KnottsBerryFarm,
  // Herschend Parks,
  Dollywood,
  SilverDollarCity,
  // Seaworld
  SeaworldOrlando,
  // Efteling
  Efteling,
  // Universal Florida
  UniversalStudiosFlorida,
  UniversalIslandsOfAdventure,
  UniversalVolcanoBay,
  // Universal Hollywood
  UniversalStudiosHollywood,
  // Universal Studios Singapore
  UniversalStudiosSingapore,
  // Six Flags Parks
  SixFlagsOverTexas,
  SixFlagsOverGeorgia,
  SixFlagsStLouis,
  SixFlagsGreatAdventure,
  SixFlagsMagicMountain,
  SixFlagsGreatAmerica,
  SixFlagsFiestaTexas,
  SixFlagsHurricaneHarborArlington,
  SixFlagsHurricaneHarborLosAngeles,
  SixFlagsAmerica,
  SixFlagsDiscoveryKingdom,
  SixFlagsNewEngland,
  SixFlagsHurricaneHarborJackson,
  TheGreatEscape,
  SixFlagsWhiteWaterAtlanta,
  SixFlagsMexico,
  LaRondeMontreal,
  SixFlagsHurricaneHarborOaxtepec,
  SixFlagsHurricaneHarborConcord,
};
