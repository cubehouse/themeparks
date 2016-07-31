"use strict";

// expose Settings object to allow overriding of some basic defaults
exports.Settings = require("./settings");

// Array of available theme parks in the API
exports.Parks = [].concat(
    // Walt Disney World Florida
    require("./disneyworld/waltdisneyworld")
);