"use strict";

const CouchbaseChannel = require("./couchbaseChannel");

class CouchbaseChannelDisney extends CouchbaseChannel {
    constructor(dbName, channel) {
        // call super with our db URL
        super("https://realtime-sync-gw.wdprapps.disney.com/park-platform-pub", dbName, channel);

        // use default Disney couchbase DB auth
        this.Auth = {
            user: "WDPRO-MOBILE.MDX.WDW.ANDROID-PROD",
            password: "ieNgak4ahph5th",
        };
    }
}

module.exports = CouchbaseChannelDisney;