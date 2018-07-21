exports.ModuleName = 'themeparks';

// set if we're in debug mode or not (done once)
exports.IsDebug = (new RegExp(`\\b${exports.ModuleName}\\b`, 'i').test(process.env.NODE_DEBUG));

// expose offline tests object, null by default
//  will be set by unit tests to trigger offline testing
exports.OfflineTests = null;
