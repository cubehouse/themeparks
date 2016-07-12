"use strict";

// this is a basic wrapper for making Request() requests
//  we wrap this so we can have the same debug information for all requests
//  and we can intercept URLs easier with nock when running unit tests

var request = require("request");

// detect if we're in debug mode
var IsDebug = require("./debug").IsDebug;
var Log = require("./debugPrint");

/**
 * Make a network request
 * @param parameters to pass to request library
 */
function MakeRequest(networkRequest) {
    if (arguments.length != 1) {
        throw new Error("HTTP requires 1 argument. The network object configuration");
    }

    if (IsDebug) {
        // setup offline tests if we're in debug mode
        // TODO - gather offline test function from debug library
        //if (callerObject && callerObject.SetupOfflineTests) {
        //    callerObject.SetupOfflineTests();
        //}

        // debug log if we're in debug mode
        Log(`Making request to ${networkRequest.url}`);
    }

    // build-in retires into this wrapper (default 3)
    var retries = networkRequest.retries || 3;
    // un-set retries in-case request suddenly supports this or something!
    delete networkRequest.retries;

    // we will default to returning the body, but can return the full response object if we want
    var returnFullResponse = networkRequest.returnFullResponse || false;
    delete networkRequest.returnFullResponse;

    // add ability to force responses into JSON objects, even if they don't return application/json content header
    var forceJSON = networkRequest.forceJSON || false;
    delete networkRequest.forceJSON;

    // return result as a Promise!
    return new Promise(function(resolve, reject) {
        var attempt = 0;

        // make request in an anonymouse function so we can make multiple requests to it easily
        var attemptRequest = function() {
            // pass all arguments after the first to request
            request(networkRequest, function(err, resp, body) {
                if (err) {
                    if (attempt < retries) {
                        // if we have retires left, try again!
                        attempt++;
                        Log(`Network request failed attempt ${attempt}/${retries} for URL ${networkRequest.url}`);
                        Log(err);
                        return process.nextTick(attemptRequest);
                    } else {
                        return reject(err);
                    }
                }

                // no error! return the result
                if (returnFullResponse) {
                    Log(`Successfully fetched response for URL ${networkRequest.url}`);
                    return resolve(resp);
                } else {
                    if (forceJSON) {
                        var JSONData;
                        try {
                            JSONData = JSON.parse(body);
                        } catch (e) {
                            return reject(`Unable to parse ${body} into a JSON object: ${e}`);
                        }
                        Log(`Successfully fetched and parse JSON from response at ${networkRequest.url}`);
                        return resolve(JSONData);
                    } else {
                        Log(`Successfully fetched body for URL ${networkRequest.url}`);
                        return resolve(body);
                    }
                }
            });
        };

        // make first request attempt
        process.nextTick(attemptRequest);
    }.bind(this));
}

module.exports = MakeRequest;