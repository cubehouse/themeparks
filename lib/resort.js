"use strict";

const Location = require("./location");

// symbols
const s_resortParks = Symbol();

/**
 * Resort class structures multiple parks belonging to a single resort together
 * @class
 */
class Resort extends Location {
    constructor(options = {}) {
        super(options);

        if (this.constructor === Resort) {
            throw new Error("Cannot create Resort object directly");
        }

        // force parks option to an array
        this[s_resortParks] = [].concat(options.parks || []);

        // check this resort has some valid parks
        if (this[s_resortParks].length == 0) {
            throw new Error(`No parks supplied for resort ${this.name}`);
        }
    }

    /**
     * Get an array of uninstantiated park objects for this resort
     */
    get Parks() {
        return this[s_resortParks];
    }
}

module.exports = Resort;