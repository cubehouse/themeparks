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

// Universal Florida
var UniversalStudiosFlorida = require("./universal/universalstudiosflorida");
var UniversalIslandsOfAdventure = require("./universal/universalislandsofadventure");

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
    // Universal Florida
    UniversalStudiosFlorida,
    UniversalIslandsOfAdventure,
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
    // Universal Florida
    "UniversalStudiosFlorida": UniversalStudiosFlorida,
    "UniversalIslandsOfAdventure": UniversalIslandsOfAdventure
};