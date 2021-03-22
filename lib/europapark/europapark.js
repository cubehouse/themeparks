const HostedPark = require('../hostedPark');

/**
 * Implements the Europa Park API framework.
 * @class
 * @extends HostedPark
 */
class EuropaPark extends HostedPark {
  /**
   * Create new EuropaPark Object.
   * @param {Object} [options]
   * @param {String} [options.apiBase] Optional base URL for API requests
   * @param {String} [options.apiVersion] API Version to make requests to (default: 'api-5.2')
   * @param {String} [options.secretToken] Secret token to use to generate the wait times API access token
   */
  constructor(options = {}) {
    options.name = options.name || 'Europa Park';

    // Europa-Park coordinates
    options.latitude = options.latitude || 48.268931;
    options.longitude = options.longitude || 7.721559;

    // park's timezone
    options.timezone = 'Europe/Berlin';

    // inherit from base class
    super(options);
  }
}

// export the class
module.exports = EuropaPark;
