"use strict";

// base Disney World park objects
var Park = require("../park.js");

// HTTP library
var HTTP = require("../http");

// load user settings
var Settings = require("../settings");
// configure the Disney API's cache key
var cacheKey = "disneyapi_";

// Disney API configuration keys
var s_disneyAPIResortID = Symbol();
var s_disneyAPIParkID = Symbol();
var s_disneyAPIParkRegion = Symbol();

// API settings
var api_accessTokenURL = "https://authorization.go.com/token";
var api_accessTokenURLBody = "grant_type=assertion&assertion_type=public&client_id=WDPRO-MOBILE.MDX.WDW.ANDROID-PROD";
var api_accessTokenURLMethod = "POST";
var api_appID = "WDW-MDX-ANDROID-3.4.1";

class WaltDisneyWorldPark extends Park {
  constructor(options = {}) {
    options.name = options.name || "Walt Disney World Resort";
    options.timezone = options.timezone || "America/New_York";

    // set resort's general center point
    options.latitude = 28.3852;
    options.longitude = -81.5639;

    // create a random Android useragent for use with the Disney API
    options.useragent = function(ua) {
      return (ua.osName == "Android");
    };

    // inherit from base class
    super(options);

    // grab disney API configuration settings (or throw an error if value is missing/null)
    if (!options.resort_id) throw new Error("Missing park's resort ID");
    this[s_disneyAPIResortID] = options.resort_id;
    if (!options.park_id) throw new Error("Missing park's API ID");
    this[s_disneyAPIParkID] = options.park_id;
    if (!options.park_region) throw new Error("Missing park's region");
    this[s_disneyAPIParkRegion] = options.park_region;
  }

  // override Fastpass Getter to declare support for FastPass
  //  (all Disney parks offer Fastpass)
  get FastPass() {
    return true;
  }

  /**
   * Get our current access token
   */
  GetAccessToken() {
    return new Promise(function(resolve, reject) {
      // first, check the cache!
      Settings.Cache.get(cacheKey + "accesstoken", function(err, accessToken) {
        if (err || !accessToken) {
          // request a fresh access token
          HTTP({
            url: api_accessTokenURL,
            method: api_accessTokenURLMethod,
            body: api_accessTokenURLBody,
            // Disney API doesn't want to return as application/JSON, so we'll manually parse it into a nice object
            forceJSON: true
          }).then(function(body) {
            if (!body.access_token) {
              return reject("Returned access token data missing access_token");
            }
            if (!body.expires_in) {
              return reject("Returned access token data missing expires_in");
            }

            // parse expires_in into an int
            var expiresIn = parseInt(body.expires_in, 10);

            // store access token in cache
            Settings.Cache.set(cacheKey + "accesstoken", body.access_token, {
              ttl: expiresIn
            }, function() {
              // return our new access token
              return resolve(body.access_token);
            });
          }, reject);
        } else {
          // found cached access token! return it
          return resolve(accessToken);
        }
      });
    });

  }
}

// export just the Base Disney Park class
module.exports = WaltDisneyWorldPark;