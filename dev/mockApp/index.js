"use strict";

const restify = require("restify");

// some pretend rides in various pretend states
const rides = [{
    name: "It's a really big world. Go travel it",
    waitTime: 5,
    status: "Running"
}, {
    name: "Manspider",
    waitTime: 35,
    status: "Running"
}, {
    name: "Small Lightning Hill",
    waitTime: 0,
    status: "Under Maintenance"
}];

const server = restify.createServer({
    name: "mockpark",
    version: "1.0.0"
});

// return our rides in a pretend nonsense API for testing
server.get("/park/rides", (req, res) => {
    const response = [];

    for (let i = 0; i < rides.length; i++) {
        response.push({
            id: i,
            time: rides[i].waitTime,
            status: rides[i].status
        });
    }

    res.send({
        rides: response
    });
});

// return park data
server.get("/park/data", (req, res) => {
    const response = [];

    for (let i = 0; i < rides.length; i++) {
        response.push({
            id: i,
            name: rides[i]
        });
    }

    res.send({
        data: response
    });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    /* eslint-disable */
    console.log(`Listening on port ${PORT}`);
    /* eslint-enable */
});