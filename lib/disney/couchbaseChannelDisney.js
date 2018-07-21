const CouchbaseChannel = require('./couchbaseChannel');

class CouchbaseChannelDisney extends CouchbaseChannel {
  constructor(options = {}) {
    options.url = options.url || 'https://realtime-sync-gw.wdprapps.disney.com/park-platform-pub';
    options.auth = options.auth || {
      user: 'WDPRO-MOBILE.MDX.WDW.ANDROID-PROD',
      password: 'ieNgak4ahph5th',
    };

    // call super with our db URL
    super(options);
  }
}

module.exports = CouchbaseChannelDisney;
