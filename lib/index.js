"use strict";

// expose Settings object to allow overriding of some basic defaults
exports.Settings = require("./settings");

// Array of available theme parks in the API
exports.AllParks = [].concat(
    // Walt Disney World Florida
    require("./disneyworld/waltdisneyworld"),
    // Shanghai Disney Resort 
    require("./disneyworld/shanghaidisneyresort")
);

// export all parks by name
exports.Parks = [];
for (var i = 0, park; park = exports.AllParks[i++];) {
    exports.Parks[park.name] = park;
}