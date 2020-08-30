const HostedPark = require('../hostedPark');

/**
 * Implements the Disneyland Paris API framework.
 * @class
 * @extends Park
 */
class DisneyParisPark extends HostedPark {
  constructor(options = {}) {
    options.name = options.name || 'Disneyland Paris Park';
    options.timezone = options.timezone || 'Europe/Paris';

    super(options);
  }
}

module.exports = DisneyParisPark;
