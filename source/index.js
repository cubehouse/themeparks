"use strict";

import "babel-polyfill";

// source-map support for ES6 compiled code
import 'source-map-support/register'

// boot up test file and run some basic functions on it for testing
import WaltDisneyWorldPark from "./disneyworld/waltdisneyworld.js";
var p = new WaltDisneyWorldPark();

p.Log("Name:", p.Name);
p.Log("Location:", p.Location.toString());
p.Log("Supports FastPass?:", p.FastPass);