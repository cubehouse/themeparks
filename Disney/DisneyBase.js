"use strict";

// get the base Park class
var Park = require("../parkBase");

// export the Disney base park object
module.exports = DisneyBase;

function DisneyBase(config) {
  // Call to parent class "Park" to inherit
  Park.call(this, config);

  this.name = "Generic Disney Park";

  // TODO - some generic processing for Disney parks
  //  each implementation will need to define some extra logic/vars for this
  this.GetOpeningTimes = function(callback) {
    return callback("TODO - implement this");
  };
}

// sort out prototype inheritance
DisneyBase.prototype = Object.create(Park.prototype);
DisneyBase.prototype.constructor = DisneyBase;