"use strict";

// base Disney World park objects
import Park from '../park.js';

export default class WaltDisneyWorldPark extends Park {
  constructor(options = {}) {
    options.name = options.name || "Walt Disney World Resort";
    options.timezone = options.timezone || "America/New_York";

    // set resort's general center point
    options.latitude = 28.3852;
    options.longitude = -81.5639;

    // inherit from base class
    super(options);
  }

  async Test() {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        return reject(new Error("FAILED!"));
        //resolve("TEstsdgfdsgd");
      }, 3 * 100);
    });
  }
  
  // override Fastpass Getter to declare support for FastPass
  get FastPass() {
    return true;
  }
}
