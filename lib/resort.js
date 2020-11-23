const Location = require('./location');

// symbols
const sResortParks = Symbol('Resort Parks');

/**
 * Resort class structures multiple parks belonging to a single resort together
 * @class
 */
class Resort extends Location {
  constructor(options = {}) {
    super(options);

    if (this.constructor === Resort) {
      throw new Error('Cannot create Resort object directly');
    }

    // force parks option to an array
    this[sResortParks] = [].concat(options.parks || []);

    // check this resort has some valid parks
    if (this[sResortParks].length === 0) {
      throw new Error(`No parks supplied for resort ${this.name}`);
    }
  }

  /**
     * Get an array of uninstantiated park objects for this resort
     */
  get getParks() {
    return this[sResortParks];
  }
}

module.exports = Resort;
