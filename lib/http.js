// this is a basic wrapper for making Request() requests
//  we wrap this so we can have the same debug information for all requests

// fs lib for writing/reading mock requests
const fs = require('fs');

const util = require('util');

const needle = require('needle');

// get our project Log function for writing log output
const Log = require('./debugPrint');

const fsExists = util.promisify(fs.exists);
const fsReadFile = util.promisify(fs.readFile);
const fsWriteFile = util.promisify(fs.writeFile);

function GetMockFilename(mockName) {
  return `${__dirname}/mocks/${mockName}.mock`;
}

function SetMock(mockName, response) {
  // only store mock responses if THEMEPARKS_MOCKWRITE is set
  if (!process.env.THEMEPARKS_MOCKWRITE || mockName === undefined) return Promise.resolve(response);

  return fsWriteFile(GetMockFilename(mockName), JSON.stringify(response)).then(
    () => Promise.resolve(response)
  );
}

function GetMock(mockName) {
  // return undefined result if we're not in mock mode
  if (!process.env.THEMEPARKS_MOCK) return Promise.resolve();

  if (mockName === undefined) return Promise.resolve();

  const filename = GetMockFilename(mockName);
  return fsExists(filename).catch(() => Promise.resolve).then((exists) => {
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
  if (arguments.length !== 1) {
    return Promise.reject(new Error('HTTP requires 1 argument. The network object configuration'));
  }

  const options = networkRequest;

  return GetMock(options.mock).then((mockData) => {
    if (mockData !== undefined) {
      // Log(`Returning mock request for ${options.mock}`);
      return Promise.resolve(mockData);
    }

    // debug log if we're in debug mode
    Log(`Making request to ${options.url}`);

    // grab method from the request (we'll call .[method] directly using the needle library)
    const requestMethod = options.method || 'get';
    delete options.method;

    // extract the required URL
    const requestURL = options.url;
    if (!requestURL) return Promise.reject(new Error(`No URL defined for ${requestMethod} request`));
    delete options.url;

    const requestData = options.data || options.body || {};
    delete options.data;
    delete options.body;

    // build-in retires into this wrapper (default 3)
    const retries = options.retries || 3;
    // un-set retries in-case request suddenly supports this or something!
    delete options.retries;

    // default delay of 2 seconds for each retry attempt
    const retryDelay = options.retryDelay || 2000;
    delete options.retryDelay;

    // we will default to returning the body, but can return the full response object if we want
    const returnFullResponse = options.returnFullResponse || false;
    delete options.returnFullResponse;

    // add ability to force responses into JSON objects
    //  even if they don't return application/json content header
    let forceJSON = options.forceJSON || false;
    delete options.forceJSON;

    // return result as a Promise!
    return new Promise((resolve, reject) => {
      let attempt = 0;

      // make request in an anonymous function so we can make multiple requests to it easily
      const attemptRequest = () => {
        Log(`Calling ${requestMethod}:${requestURL}`);

        // build Needle request
        needle.request(requestMethod, requestURL, requestData, options, (err, resp) => {
          if (err || resp.statusCode >= 400 || (resp.statusCode === 200 && !resp.body)) {
            Log(`Network request failed attempt ${attempt + 1}/${retries} for URL ${requestURL}`);
            Log(err || (`${resp.statusCode}: ${JSON.stringify(resp.body, null, 2)}`));

            // if we have retires left, try again!
            attempt += 1;
            if (attempt < retries) {
              // try again after retryDelay milliseconds
              setTimeout(attemptRequest, retryDelay);
              return;
            }

            reject(err || (`${resp.statusCode}: ${JSON.stringify(resp.body, null, 2)}`));
            return;
          }

          // no error! return the result
          if (returnFullResponse) {
            Log(`Successfully fetched response for URL ${requestURL}`);
            SetMock(options.mock, resp).then(resolve);
          } else {
            // enable "forceJSON" if the return header type is "application/json"
            if (resp.headers && resp.headers['content-type'] && resp.headers['content-type'].indexOf('application/json') >= 0) {
              Log("Found 'application/json' header from in HTTP request, parsing JSON data");
              forceJSON = true;
            }

            // if we want to force JSON (and we're not already a JSON object!)
            if (forceJSON && resp.body.constructor.name !== {}.constructor.name && resp.body.constructor.name !== [].constructor.name) {
              let JSONData;
              try {
                JSONData = JSON.parse(resp.body);
              } catch (e) {
                reject(new Error(`Unable to parse ${resp.body} into a JSON object: ${e}`));
                return;
              }
              Log(`Successfully fetched and parsed JSON from response at ${requestURL}`);
              SetMock(options.mock, JSONData).then(resolve);
            } else {
              Log(`Successfully fetched body for URL ${requestURL}`);
              SetMock(options.mock, resp.body).then(resolve);
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
