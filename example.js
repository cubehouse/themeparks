var parks = require("./index");

var HongKongDisney = new parks.DisneylandHongKong();

HongKongDisney.GetWaitTimes(function(err, times) {
  if (err) return console.error(err);

  console.log(JSON.stringify(times, null, 2));
});