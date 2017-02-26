// allow console for unit tests
/* eslint-disable no-console */

console.log("# This script generated the SixFlags park files automatically");
console.log("# There are so many parks by SixFlags, this is a far more convenient way of updating the codebase!");
console.log("");

// ADD THIS - get an API key from timezoned, and put it here to run this script
var timezonedbapikey = process.env.APIKEY || "";

if (!timezonedbapikey) {
    console.error("Missing Timezoned API key, this is needed for figuring out each park's timezone from it's geo location");
    console.error("Please fill in the variable in the script and re-run");
    process.exit(0);
}

var fs = require("fs");

var SixFlagsPark = require("../lib/sixflags/index");
// make pretend SixFlagsPark to get API access setup
var sf = new SixFlagsPark({
    park_id: 1,
    name: "Six Flags",
    latitude: 33.7675,
    longitude: -84.5514,
});

// request park list from API
sf.GetAPIUrl({
    url: `${sf.APIBase}park`
}).then(function(data) {
    var todo = [];
    for (var i = 0, park; park = data.parks[i++];) {
        todo.push(park);
    }

    var requires = [];

    var step = function() {
        var c = todo.shift();

        if (!c) {
            console.log("");
            for (var i = 0, r; r = requires[i++];) {
                console.log(`var ${r} = require("./sixflags/${r.toLowerCase()}");`);
            }
            console.log("");
            for (i = 0, r; r = requires[i++];) {
                console.log(`${r},`);
            }
            console.log("");
            for (i = 0, r; r = requires[i++];) {
                console.log(`"${r}": ${r},`);
            }
            return;
        }

        console.log(" ");
        console.log("Processing " + c.name);

        // write park file
        CreateParkString(c).then(function(requirename) {
            requires.push(requirename);

            process.nextTick(step);
        }.bind(this), console.error);
    };
    process.nextTick(step);
});

function CreateParkString(park) {
    return new Promise(function(resolve, reject) {
        var long = park.entranceLocation ? park.entranceLocation.longitude : park.location.longitude;
        var lat = park.entranceLocation ? park.entranceLocation.latitude : park.location.latitude;

        GetTimeZone(lat, long).then(function(timezone) {
            var parkID = park.name.replace(/é/g, "e").replace(/[^a-zA-Z0-9]/g, "");

            console.log("Filling in " + parkID);

            var parkString = `"use strict";

var SixFlagsPark = require("./index");

/**
 * ${park.name}
 * @class
 * @extends SixFlagsPark
 */
class ${parkID} extends SixFlagsPark {
    /**
     * Create a new ${parkID} object
     */
    constructor(options = {}) {
        options.name = options.name || "${park.name}";
        options.timezone = options.timezone || "${timezone}";

        // set park's location as it's entrance
        options.latitude = options.latitude || ${lat};
        options.longitude = options.longitude || ${long};

        options.park_id = options.park_id || "${park.parkId}";

        // inherit from base class
        super(options);
    }
}

module.exports = ${parkID};
`;

            // use proper newlines
            parkString = parkString.replace(/[\n\r]/g, "\r\n");

            // write file
            var filename = parkID.toLowerCase();
            console.log(`Writing file ${filename}.js`);
            fs.writeFile(__dirname + `/../lib/sixflags/${filename}.js`, parkString, function(err) {
                if (err) return reject(err);

                resolve(parkID);
            });
        }.bind(this), reject);
    }.bind(this));
}

function GetTimeZone(lat, long) {
    return new Promise(function(resolve, reject) {
        require("../lib/http")({
            url: "http://api.timezonedb.com/v2/get-time-zone",
            data: {
                key: timezonedbapikey,
                format: "json",
                lat: lat,
                lng: long,
                by: "position"
            }
        }).then(function(data) {
            console.log("Got timezone " + data.zoneName);
            resolve(data.zoneName);
        }, reject);
    });
}


/* eslint-enable no-console */