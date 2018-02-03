"use strict";

const Location = require("./location");

// symbols
const s_resortParks = Symbol();

/**
 * Resort class structures multiple parks belonging to a single resort together
 * @class
 */
class Resort extends Location {
    constructor(options = {}, park_options = {}) {
        super(options);

        if (this.constructor === Resort) {
            throw new Error("Cannot create Resort object directly");
        }

        // force parks option to an array
        const parks = [].concat(options.parks || []);

        // check this resort has some valid parks
        if (parks.length == 0) {
            throw new Error(`No parks supplied for resort ${this.name}`);
        }

        // construct each of our parks and store it
        this[s_resortParks] = [];
        for (let i = 0, park; park = parks[i++];) {
            this[s_resortParks].push(new park(park_options));
        }
    }

    /**
     * Get an array of instantiated park objects for this resort
     */
    get Parks() {
        return this[s_resortParks];
    }
}

module.exports = Resort;