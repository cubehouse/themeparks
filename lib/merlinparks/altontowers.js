"use strict";

var MerlinPark = require("./index");

/**
 * Alton Towers
 * @class
 * @extends MerlinPark
 */
class AltonTowers extends MerlinPark {
    /**
     * Create a new AltonTowers object
     */
    constructor(options = {}) {
        options.name = options.name || "Alton Towers";
        options.timezone = options.timezone || "Europe/London";

        // set park's location as it's entrance
        options.latitude = options.latitude || 52.991064;
        options.longitude = options.longitude || -1.892292;

        // Park API options
        options.api_key = options.api_key || "5bf34ca0-1428-4163-8dde-f4db4eab6683";
        options.initial_data_version = options.initial_data_version || "2017-06-08T08:06:24Z";

        // where the calendar API is hosted for opening times
        options.calendar_base = "https://www.altontowers.com/";

        // inherit from base class
        super(options);
    }

    FetchParkData(version) {
        // first, try to call base version (so when data appears, it will start fetching live data)
        return new Promise((resolve) => {
            return super.FetchParkData(version).then(resolve).catch(() => {
                // return fallback data if data isn't live yet
                return resolve({
                    Item: dataCache
                });
            });
        });
    }
}

module.exports = AltonTowers;

/* eslint-disable */
var dataCache = [{
        "_id": "4188",
        "Name": "Nemesis"
    },
    {
        "_id": "4189",
        "Name": "Galactica"
    },
    {
        "_id": "4190",
        "Name": "The Blade"
    },
    {
        "_id": "4192",
        "Name": "Oblivion"
    },
    {
        "_id": "4193",
        "Name": "The Smiler"
    },
    {
        "_id": "4194",
        "Name": "Spinball Whizzer"
    },
    {
        "_id": "4195",
        "Name": "Rita"
    },
    {
        "_id": "4196",
        "Name": "TH13TEEN"
    },
    {
        "_id": "4197",
        "Name": "Runaway Mine Train"
    },
    {
        "_id": "4205",
        "Name": "Octonauts Rollercoaster Adventure"
    },
    {
        "_id": "4206",
        "Name": "Postman Pat Parcel Post"
    },
    {
        "_id": "4208",
        "Name": "Duel - The Haunted House Strikes Back"
    },
    {
        "_id": "4209",
        "Name": "In The Night Garden Magical Boat Ride"
    },
    {
        "_id": "4210",
        "Name": "Mr. Bloom's Allotment"
    },
    {
        "_id": "4211",
        "Name": "Justin's House Pie-O-Matic Factory"
    },
    {
        "_id": "4214",
        "Name": "Marauder's Mayhem"
    },
    {
        "_id": "4216",
        "Name": "Charlie and Lola's Moonsquirters & Greendrops"
    },
    {
        "_id": "4217",
        "Name": "The Numtums Number-Go-Round"
    },
    {
        "_id": "4219",
        "Name": "Get Set Go Tree Top Adventure"
    },
    {
        "_id": "4221",
        "Name": "Frog Hopper"
    },
    {
        "_id": "4223",
        "Name": "Heave Ho"
    },
    {
        "_id": "4224",
        "Name": "Gallopers Carousel"
    },
    {
        "_id": "4225",
        "Name": "Congo River Rapids"
    },
    {
        "_id": "4227",
        "Name": "Enterprise"
    },
    {
        "_id": "4231",
        "Name": "Battle Galleons"
    },
    {
        "_id": "4505",
        "Name": "Hex - The Legend of the Towers"
    },
    {
        "_id": "4524",
        "Name": "Cuckoo Cars Driving School"
    },
    {
        "_id": "4525",
        "Name": "Go Jetters Vroomster Zoom Ride"
    },
    {
        "_id": "4533",
        "Name": "The Furchester Hotel Live Show"
    },
    {
        "_id": "4773",
        "Name": "Wicker Man"
    }
];
/* eslint-enable */
