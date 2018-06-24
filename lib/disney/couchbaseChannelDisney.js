"use strict";

const CouchbaseChannel = require("./couchbaseChannel");

class CouchbaseChannelDisney extends CouchbaseChannel {
    constructor(options = {}) {
        // call super with our db URL
        super({
            url: "https://realtime-sync-gw.wdprapps.disney.com/park-platform-pub",
            dbName: options.dbName,
            channel: options.channel,
            auth: {
                user: "WDPRO-MOBILE.MDX.WDW.ANDROID-PROD",
                password: "ieNgak4ahph5th",
            }
        });
    }
}

module.exports = CouchbaseChannelDisney;