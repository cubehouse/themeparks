"use strict";

// boot up test file and run some basic functions on it for testing
var WaltDisneyWorldPark = require("./disneyworld/waltdisneyworld.js");
var p = new WaltDisneyWorldPark();

p.Log("Name:", p.Name);
p.Log("Location:", p.Location.toString());
p.Log("Supports FastPass?:", p.FastPass);
p.GetAccessToken().then(console.log, console.error);

exports.Settings = require("./settings");

// Array of available theme parks in the API
exports.Parks = [
    WaltDisneyWorldPark,
];

/*
var fs = require("fs");

function readFile(filename, enc) {
    return new Promise(function(fulfill, reject) {
        fs.readFile(filename, enc, function(err, res) {
            if (err) reject(err);
            else fulfill(res);
        });
    });
}

readFile(__dirname + "/index.js", "utf8").then(console.log, console.error);
*/