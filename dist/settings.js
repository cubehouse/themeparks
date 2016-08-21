"use strict";

// our default cache system

var cacheManager = require("cache-manager");

module.exports = {
    // default cache system (replacable, see https://github.com/BryanDonovan/node-cache-manager)
    Cache: cacheManager.caching({
        store: 'memory',
        max: 1000,
        ttl: 60 * 30 // 30 minutes
    }),
    // default Park Settings
    DefaultParkName: "Default Park",
    DefaultParkTimezone: "Europe/London",
    DefaultParkTimeFormat: null,
    // cache settings (in seconds)
    DefaultCacheWaitTimesLength: 60 * 5 };
//# sourceMappingURL=settings.js.map