"use strict";

// base Disney World park objects
import Park from '../park.js';

// Disney API configuration keys
var s_disneyAPIResortID = Symbol();
var s_disneyAPIParkID = Symbol();
var s_disneyAPIParkRegion = Symbol();

export default class WaltDisneyWorldPark extends Park {
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
}