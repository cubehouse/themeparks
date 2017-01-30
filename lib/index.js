"use strict";

// source-map support for ES6 compiled code
require("source-map-support/register");

// expose Settings object to allow overriding of some basic defaults
exports.Settings = require("./settings");


// === Include Park Libs ===

// Walt Disney World Resort
var WaltDisneyWorldEpcot = require("./disney/waltdisneyworldepcot");
var WaltDisneyWorldMagicKingdom = require("./disney/waltdisneyworldmagickingdom");
var WaltDisneyWorldHollywoodStudios = require("./disney/waltdisneyworldhollywoodstudios");
var WaltDisneyWorldAnimalKingdom = require("./disney/waltdisneyworldanimalkingdom");

// Disneyland Resort
var DisneylandResortMagicKingdom = require("./disney/disneylandresortmagickingdom");
var DisneylandResortCaliforniaAdventure = require("./disney/disneylandresortcaliforniaadventure");

// Disneyland Paris
var DisneylandParisMagicKingdom = require("./disney/disneylandparismagickingdom");
var DisneylandParisWaltDisneyStudios = require("./disney/disneylandpariswaltdisneystudios");

// Shanghai Disney Resort
var ShanghaiDisneyResortMagicKingdom = require("./disney/shanghaidisneyresort");

// Tokyo Disney Resort
var TokyoDisneyResortMagicKingdom = require("./disneytokyo/tokyodisneyresortmagickingdom");
var TokyoDisneyResortDisneySea = require("./disneytokyo/tokyodisneyresortdisneysea");

// Hong Kong Disneyland
var HongKongDisneyland = require("./disney/hongkongdisneyland");

// Universal Florida
var UniversalStudiosFlorida = require("./universal/universalstudiosflorida");
var UniversalIslandsOfAdventure = require("./universal/universalislandsofadventure");
var UniversalVolcanoBay = require("./universal/universalvolcanobay");

// Universal Hollywood
var UniversalStudiosHollywood = require("./universal/universalstudioshollywood");

// Seaworld Parks
var SeaworldOrlando = require("./seaworld/seaworldorlando");
var SeaworldSanAntonio = require("./seaworld/seaworldsanantonio");
var SeaworldSanDiego = require("./seaworld/seaworldsandiego");
var BuschGardensTampaBay = require("./seaworld/buschgardenstampabay");
var BuschGardensWilliamsburg = require("./seaworld/buschgardenswilliamsburg");
var SesamePlace = require("./seaworld/sesameplace");

// Europa Park
var EuropaPark = require("./europapark");

// Six Flags Parks
var SixFlagsOverTexas = require("./sixflags/sixflagsovertexas");
var SixFlagsOverGeorgia = require("./sixflags/sixflagsovergeorgia");
var SixFlagsStLouis = require("./sixflags/sixflagsstlouis");
var SixFlagsGreatAdventure = require("./sixflags/sixflagsgreatadventure");
var SixFlagsMagicMountain = require("./sixflags/sixflagsmagicmountain");
var SixFlagsGreatAmerica = require("./sixflags/sixflagsgreatamerica");
var SixFlagsFiestaTexas = require("./sixflags/sixflagsfiestatexas");
var SixFlagsHurricaneHarborArlington = require("./sixflags/sixflagshurricaneharborarlington");
var SixFlagsHurricaneHarborLosAngeles = require("./sixflags/sixflagshurricaneharborlosangeles");
var SixFlagsAmerica = require("./sixflags/sixflagsamerica");
var SixFlagsDiscoveryKingdom = require("./sixflags/sixflagsdiscoverykingdom");
var SixFlagsNewEngland = require("./sixflags/sixflagsnewengland");
var SixFlagsHurricaneHarborJackson = require("./sixflags/sixflagshurricaneharborjackson");
var TheGreatEscape = require("./sixflags/thegreatescape");
var SixFlagsWhiteWaterAtlanta = require("./sixflags/sixflagswhitewateratlanta");
var SixFlagsMxico = require("./sixflags/sixflagsmxico");
var LaRondeMontreal = require("./sixflags/larondemontreal");

// Merlin Parks
var AltonTowers = require("./merlinparks/altontowers");

// Parc Asterix
var AsterixPark = require("./asterixpark/");

// Hershey Park
var HersheyPark = require("./hersheys");

var ChessingtonWorldOfAdventures = require("./merlinparks/chessingtonworldofadventures");

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
    // Shanghai Disney Resort 
    ShanghaiDisneyResortMagicKingdom,
    // Tokyo Disney Resort
    TokyoDisneyResortMagicKingdom,
    TokyoDisneyResortDisneySea,
    // Hong Kong Disneyland
    HongKongDisneyland,
    // Universal Florida
    UniversalStudiosFlorida,
    UniversalIslandsOfAdventure,
    UniversalVolcanoBay,
    // Universal Hollywood
    UniversalStudiosHollywood,
    // Seaworld Parks
    SeaworldOrlando,
    SeaworldSanAntonio,
    SeaworldSanDiego,
    BuschGardensTampaBay,
    BuschGardensWilliamsburg,
    SesamePlace,
    // Europa Park
    EuropaPark,
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
    SixFlagsMxico,
    LaRondeMontreal,
    // Merlin Parks
    AltonTowers,
    // Parc Asterix
    AsterixPark,
    // Hershey Park
    HersheyPark,
    // Chessington World Of Adventures
    ChessingtonWorldOfAdventures
];

// export all parks by name
exports.Parks = {
    // Walt Disney World Resort
    "WaltDisneyWorldMagicKingdom": WaltDisneyWorldMagicKingdom,
    "WaltDisneyWorldEpcot": WaltDisneyWorldEpcot,
    "WaltDisneyWorldHollywoodStudios": WaltDisneyWorldHollywoodStudios,
    "WaltDisneyWorldAnimalKingdom": WaltDisneyWorldAnimalKingdom,
    // Disneyland Resort
    "DisneylandResortMagicKingdom": DisneylandResortMagicKingdom,
    "DisneylandResortCaliforniaAdventure": DisneylandResortCaliforniaAdventure,
    // Disneyland Paris
    "DisneylandParisMagicKingdom": DisneylandParisMagicKingdom,
    "DisneylandParisWaltDisneyStudios": DisneylandParisWaltDisneyStudios,
    // Shanghai Disney Resort
    "ShanghaiDisneyResortMagicKingdom": ShanghaiDisneyResortMagicKingdom,
    // Tokyo Disney Resort
    "TokyoDisneyResortMagicKingdom": TokyoDisneyResortMagicKingdom,
    "TokyoDisneyResortDisneySea": TokyoDisneyResortDisneySea,
    // Hong Kong Disneyland
    "HongKongDisneyland": HongKongDisneyland,
    // Universal Florida
    "UniversalStudiosFlorida": UniversalStudiosFlorida,
    "UniversalIslandsOfAdventure": UniversalIslandsOfAdventure,
    "UniversalVolcanoBay": UniversalVolcanoBay,
    // Universal Hollywood
    "UniversalStudiosHollywood": UniversalStudiosHollywood,
    // Seaworld Parks
    "SeaworldOrlando": SeaworldOrlando,
    "SeaworldSanAntonio": SeaworldSanAntonio,
    "SeaworldSanDiego": SeaworldSanDiego,
    "BuschGardensTampaBay": BuschGardensTampaBay,
    "BuschGardensWilliamsburg": BuschGardensWilliamsburg,
    "SesamePlace": SesamePlace,
    // Europa Park
    "EuropaPark": EuropaPark,
    // Six Flags Parks
    "SixFlagsOverTexas": SixFlagsOverTexas,
    "SixFlagsOverGeorgia": SixFlagsOverGeorgia,
    "SixFlagsStLouis": SixFlagsStLouis,
    "SixFlagsGreatAdventure": SixFlagsGreatAdventure,
    "SixFlagsMagicMountain": SixFlagsMagicMountain,
    "SixFlagsGreatAmerica": SixFlagsGreatAmerica,
    "SixFlagsFiestaTexas": SixFlagsFiestaTexas,
    "SixFlagsHurricaneHarborArlington": SixFlagsHurricaneHarborArlington,
    "SixFlagsHurricaneHarborLosAngeles": SixFlagsHurricaneHarborLosAngeles,
    "SixFlagsAmerica": SixFlagsAmerica,
    "SixFlagsDiscoveryKingdom": SixFlagsDiscoveryKingdom,
    "SixFlagsNewEngland": SixFlagsNewEngland,
    "SixFlagsHurricaneHarborJackson": SixFlagsHurricaneHarborJackson,
    "TheGreatEscape": TheGreatEscape,
    "SixFlagsWhiteWaterAtlanta": SixFlagsWhiteWaterAtlanta,
    "SixFlagsMxico": SixFlagsMxico,
    "LaRondeMontreal": LaRondeMontreal,
    // Merlin Parks
    "AltonTowers": AltonTowers,
    // Parc Asterix
    "AsterixPark": AsterixPark,
    // Hershey Park
    "HersheyPark": HersheyPark,
    // Chessington World Of Adventures
    "ChessingtonWorldOfAdventures": ChessingtonWorldOfAdventures
};