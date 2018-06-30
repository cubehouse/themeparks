"use strict";

// this is a basic wrapper for making Request() requests
//  we wrap this so we can have the same debug information for all requests

const needle = require("needle");

// get our project Log function for writing log output
const Log = require("./debugPrint");

const util = require("util");

// fs lib for writing/reading mock requests
const fs = require("fs");
const fsExists = util.promisify(fs.exists);
const fsReadFile = util.promisify(fs.readFile);
const fsWriteFile = util.promisify(fs.writeFile);

function GetMockFilename(mockName) {
    return __dirname + "/mocks/" + mockName + ".mock";
}

function SetMock(mockName, response) {
    // only store mock responses if THEMEPARKS_MOCKWRITE is set
    if (!process.env.THEMEPARKS_MOCKWRITE) return Promise.resolve(response);

    return fsWriteFile(GetMockFilename(mockName), JSON.stringify(response)).then(() => {
        // always return the actual response object for Promise chaining
        return Promise.resolve(response);
    });
}

function GetMock(mockName) {
    // return undefined result if we're not in mock mode
    if (!process.env.THEMEPARKS_MOCK) return Promise.resolve();

    if (mockName === undefined) return Promise.resolve();

    const filename = GetMockFilename(mockName);
    return fsExists(filename).then(exists => {
        if (!exists) {
            // file doesn't exist! return undefined
            return Promise.resolve();
        }

        // read the file
        return fsReadFile(filename).then((data) => {
            let JSONData = null;
            try {
                JSONData = JSON.parse(data);
            } catch (e) {
                Log(`Failed to read mock file JSON ${mockName}`);
            }

            if (JSONData === null) {
                return Promise.resolve();
            }

            return Promise.resolve(JSONData);
        });
    });
}

/**
 * Make a network request
 * @private
 * @param parameters to pass to request library
 */
function MakeRequest(networkRequest) {
    if (arguments.length != 1) {
        return Promise.reject("HTTP requires 1 argument. The network object configuration");
    }

    return GetMock(networkRequest.mock).then((mockData) => {
        if (mockData !== undefined) {
            Log(`Returning mock request for ${networkRequest.mock}`);
            return Promise.resolve(mockData);
        }

        // debug log if we're in debug mode
        Log(`Making request to ${networkRequest.url}`);

        // grab method from the request (we'll call .[method] directly using the needle library)
        const requestMethod = networkRequest.method || "get";
        delete networkRequest.method;

        // extract the required URL
        const requestURL = networkRequest.url;
        if (!requestURL) return Promise.reject(`No URL defined for ${requestMethod} request`);
        delete networkRequest.url;

        const requestData = networkRequest.data || networkRequest.body || {};
        delete networkRequest.data;
        delete networkRequest.body;

        // build-in retires into this wrapper (default 3)
        const retries = networkRequest.retries || 3;
        // un-set retries in-case request suddenly supports this or something!
        delete networkRequest.retries;

        // default delay of 2 seconds for each retry attempt
        const retryDelay = networkRequest.retryDelay || 2000;
        delete networkRequest.retryDelay;

        // we will default to returning the body, but can return the full response object if we want
        const returnFullResponse = networkRequest.returnFullResponse || false;
        delete networkRequest.returnFullResponse;

        // add ability to force responses into JSON objects, even if they don't return application/json content header
        let forceJSON = networkRequest.forceJSON || false;
        delete networkRequest.forceJSON;

        // return result as a Promise!
        return new Promise((resolve, reject) => {
            let attempt = 0;

            // make request in an anonymous function so we can make multiple requests to it easily
            const attemptRequest = () => {
                Log(`Calling ${requestMethod}:${requestURL}`);

                // build Needle request
                needle.request(requestMethod, requestURL, requestData, networkRequest, (err, resp) => {
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
                        return SetMock(networkRequest.mock, resp).then(resolve);
                    } else {
                        // enable "forceJSON" if the return header type is "application/json"
                        if (resp.headers && resp.headers["content-type"] && resp.headers["content-type"].indexOf("application/json") >= 0) {
                            Log("Found 'application/json' header from in HTTP request, parsing JSON data");
                            forceJSON = true;
                        }

                        // if we want to force JSON (and we're not already a JSON object!)
                        if (forceJSON && resp.body.constructor !== {}.constructor && resp.body.constructor !== [].constructor) {
                            let JSONData;
                            try {
                                JSONData = JSON.parse(resp.body);
                            } catch (e) {
                                return reject(`Unable to parse ${resp.body} into a JSON object: ${e}`);
                            }
                            Log(`Successfully fetched and parsed JSON from response at ${requestURL}`);
                            return SetMock(networkRequest.mock, JSONData).then(resolve);
                        } else {
                            Log(`Successfully fetched body for URL ${requestURL}`);
                            return SetMock(networkRequest.mock, resp.body).then(resolve);
                        }
                    }
                });
            };

            // make first request attempt
            process.nextTick(attemptRequest);
        });
    });
}

module.exports = MakeRequest;