"use strict";

// expose Settings object to allow overriding of some basic defaults
exports.Settings = require("./settings");

// === Include Park Libs ===

// Walt Disney World Resort
//var WaltDisneyWorldEpcot = require("./disney/waltdisneyworldepcot");

// === Expose Parks ===

// Array of available theme parks in the API
//  we manually add each one of these as any nice IDEs that "intellisense" will pick them up :)
exports.AllParks = [
    // Walt Disney World Resort
    //WaltDisneyWorldMagicKingdom,
];

// export all parks by name
exports.Parks = {
    // Walt Disney World Resort
    //"WaltDisneyWorldMagicKingdom": WaltDisneyWorldMagicKingdom,
};