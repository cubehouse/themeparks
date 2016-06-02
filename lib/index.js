"use strict";

// boot up test file and run some basic functions on it for testing
var WaltDisneyWorldPark = require("./disneyworld/waltdisneyworld.js");
var p = new WaltDisneyWorldPark();

p.Log("Name:", p.Name);
p.Log("Location:", p.Location.toString());
p.Log("Supports FastPass?:", p.FastPass);