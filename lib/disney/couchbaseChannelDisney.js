const CouchbaseChannel = require('./couchbaseChannel');

/**
 * Example use:
 *  // setup channel
 *  const Channel = new CouchbaseChannelDisney({
 *     dbName: `myDBName`,
 *     channel: `dlp.facilitystatus.1_0`,
 *  });
 *  // subscribe to channel events
 *  Channel.on('updated', (newDoc) => {});
 *  Channel.on('error', (error) => {});
 *  // start channel sync
 *  Channel.Start().then(() => {
 *    // ready
 *  });
 */

class CouchbaseChannelDisney extends CouchbaseChannel {
  constructor(options = {}) {
    options.url = options.url || 'https://realtime-sync-gw.wdprapps.disney.com/park-platform-pub';
    options.auth = options.auth || {
      user: 'DPECP-MOBILE.WDW.ANDROID-PROD',
      password: 'Dhrxs2duQxgbV6y2',
    };

    // call super with our db URL
    super(options);
  }
}

module.exports = CouchbaseChannelDisney;
