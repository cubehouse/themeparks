const HostedPark = require('../hostedPark');

/**
 * Implements the Efteling Park
 * @class
 * @extends HostedPark
 */
class Efteling extends HostedPark {
  constructor(options = {}) {
    options.name = 'Efteling';
    options.timezone = 'Europe/Amsterdam';
    options.latitude = 51.64990915659694;
    options.longitude = 5.043561458587647;
    super(options);
  }
}

module.exports = Efteling;
