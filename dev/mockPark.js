"use strict";

const Park = require("../lib/park");

const APIUrl = "http://127.0.0.1:8080";

class MockPark extends Park {
    constructor(options = {}) {
        // our park is on a tiny island in the sea
        options.latitude = 39.69992284073077;
        options.longitude = -31.106071472167972;
        options.timezone = "Atlantic/Azores";

        options.name = "Mock Park";

        super(options);
    }

    FetchWaitTimes() {
        return this.HTTP({
            url: `${APIUrl}/park/rides`,
        }).then(this.ParseWaitTimeData);
    }

    ParseWaitTimeData(data) {
        if (!data || !data.rides) return Promise.reject("No valid ride data found");

        const rideData = [];
        for (let i = 0; i < data.rides.length; i++) {
            rideData.push({
                id: data.rides[i].id,
                waitTime: data.rides[i].time
            });
        }
        return Promise.resolve(rideData);
    }
}

module.exports = MockPark;

if (!module.parent) {
    const T = new MockPark();
    T.GetWaitTimes().then(T.Log);
}