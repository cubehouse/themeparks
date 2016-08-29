"use strict";

// source-map support for ES6 compiled code
require('source-map-support/register');

// expose Settings object to allow overriding of some basic defaults
exports.Settings = require("./settings");


// === Include Park Libs ===

// Walt Disney World Resort
var WaltDisneyWorldEpcot = require("./disneyworld/waltdisneyworldepcot");
var WaltDisneyWorldMagicKingdom = require("./disneyworld/waltdisneyworldmagickingdom");
var WaltDisneyWorldHollywoodStudios = require("./disneyworld/waltdisneyworldhollywoodstudios");
var WaltDisneyWorldAnimalKingdom = require("./disneyworld/waltdisneyworldanimalkingdom");

// Shanghai Disney Resort
var ShanghaiDisneyResortMagicKingdom = require("./disneyworld/shanghaidisneyresort");


// === Expose Parks ===

// Array of available theme parks in the API
//  we manually add each one of these as any nice IDEs that "intellisense" will pick them up :)
exports.AllParks = [
    // Walt Disney World Resort
    WaltDisneyWorldMagicKingdom,
    WaltDisneyWorldEpcot,
    WaltDisneyWorldHollywoodStudios,
    WaltDisneyWorldAnimalKingdom,
    // Shanghai Disney Resort 
    ShanghaiDisneyResortMagicKingdom,
];

// export all parks by name
exports.Parks = {
    // Walt Disney World Resort
    "WaltDisneyWorldMagicKingdom": WaltDisneyWorldMagicKingdom,
    "WaltDisneyWorldEpcot": WaltDisneyWorldEpcot,
    "WaltDisneyWorldHollywoodStudios": WaltDisneyWorldHollywoodStudios,
    "WaltDisneyWorldAnimalKingdom": WaltDisneyWorldAnimalKingdom,
    // Shanghai Disney Resort
    "ShanghaiDisneyResortMagicKingdom": ShanghaiDisneyResortMagicKingdom,
};