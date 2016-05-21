"use strict";

import "babel-polyfill";

// source-map support for ES6 compiled code
import 'source-map-support/register'

// boot up test file and run some basic functions on it for testing
import WaltDisneyWorldPark from "./disneyworld/";
var p = new WaltDisneyWorldPark();

p.Log(p.Name);
p.Log(p.Location.toString());

p.Log("Awaiting...");
(async function () {
    try {
        try {
            var res = await p.Test();
            p.Log(res);
        } catch (e) {
            p.Log(e);
            throw e;
        }

        p.Log("Continuing!");
    } catch (err) {
        p.Log(err);
    }
} ());