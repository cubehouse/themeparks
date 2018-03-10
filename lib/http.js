"use strict";

// this is a basic wrapper for making Request() requests
//  we wrap this so we can have the same debug information for all requests

var needle = require("needle");

// get our project Log function for writing log output
var Log = require("./debugPrint");

// include our Promise library
var Promise = require("./promise");

/**
 * Make a network request
 * @private
 * @param parameters to pass to request library
 */
function MakeRequest(networkRequest) {
    if (arguments.length != 1) {
        return Promise.reject("HTTP requires 1 argument. The network object configuration");
    }

    // debug log if we're in debug mode
    Log(`Making request to ${networkRequest.url}`);

    // grab method from the request (we'll call .[method] directly using the needle library)
    var requestMethod = networkRequest.method || "get";
    delete networkRequest.method;

    // extract the required URL
    var requestURL = networkRequest.url;
    if (!requestURL) return Promise.reject(`No URL defined for ${requestMethod} request`);
    delete networkRequest.url;

    var requestData = networkRequest.data || networkRequest.body || {};
    delete networkRequest.data;
    delete networkRequest.body;

    // build-in retires into this wrapper (default 3)
    var retries = networkRequest.retries || 3;
    // un-set retries in-case request suddenly supports this or something!
    delete networkRequest.retries;

    // default delay of 2 seconds for each retry attempt
    var retryDelay = networkRequest.retryDelay || 2000;
    delete networkRequest.retryDelay;

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
            Log(`Calling ${requestMethod}:${requestURL}`);

            // build Needle request
            needle.request(requestMethod, requestURL, requestData, networkRequest, function(err, resp) {
                if (err || resp.statusCode >= 400 || (resp.statusCode == 200 && !resp.body)) {
                    Log(`Network request failed attempt ${attempt}/${retries} for URL ${requestURL}`);
                    Log(err || (resp.statusCode + ": " + JSON.stringify(resp.body, null, 2)));

                    // if we have retires left, try again!
                    attempt++;
                    if (attempt < retries) {
                        // try again after retryDelay milliseconds
                        setTimeout(attemptRequest, retryDelay);
                        return;
                    } else {
                        return reject(err || (resp.statusCode + ": " + JSON.stringify(resp.body, null, 2)));
                    }
                }

                // no error! return the result
                if (returnFullResponse) {
                    Log(`Successfully fetched response for URL ${requestURL}`);
                    return resolve(resp);
                } else {
                    // enable "forceJSON" if the return header type is "application/json"
                    if (resp.headers && resp.headers["content-type"] && resp.headers["content-type"].indexOf("application/json") >= 0) {
                        Log("Found 'application/json' header from in HTTP request, parsing JSON data");
                        forceJSON = true;
                    }

                    // if we want to force JSON (and we're not already a JSON object!)
                    if (forceJSON && resp.body.constructor !== {}.constructor && resp.body.constructor !== [].constructor) {
                        let JSONData = null;
                        try {
                            JSONData = JSON.parse(resp.body);
                        } catch (e) {
                            Log(`Error pasing JSON data: ${e}`);
                            JSONData = null;
                        }

                        if (JSONData === null) {
                            // if we have retires left, try again!
                            attempt++;
                            if (attempt < retries) {
                                // try again after retryDelay milliseconds
                                setTimeout(attemptRequest, retryDelay);
                                return;
                            } else {
                                return reject(`Unable to parse ${resp.body} into a JSON object`);
                            }
                        }

                        Log(`Successfully fetched and parsed JSON from response at ${requestURL}`);
                        return resolve(JSONData);
                    } else {
                        Log(`Successfully fetched body for URL ${requestURL}`);
                        return resolve(resp.body);
                    }
                }
            });
        };

        // make first request attempt
        process.nextTick(attemptRequest);
    }.bind(this));
}

module.exports = MakeRequest;