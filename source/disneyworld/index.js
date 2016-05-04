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
        //return reject("FAILED!");
        resolve("TEstsdgfdsgd");
      }, 3 * 1000);
    });
  }
}

if (!module || !module.parent) {
  
  var p = new WaltDisneyWorldPark();

  p.Log(p.Name);
  p.Log(p.Location.toString());
  
  p.Log("Awaiting...");
  (async function() {
    try
    {
      var res = await p.Test();
      p.Log(res);
    }
    catch(e)
    {
      p.Log("Error: " + e);
    }
    
    p.Log("Continuing!");
  }());
}