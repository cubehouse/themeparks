// Disney API
var DisneyAPI = new(require("wdwjs"))();

// Get list of supported parks
console.log("*** Supported Parks ***");
for (var park in DisneyAPI) {
  // (only parks with "GetWaitTimes" function will be valid)
  if (DisneyAPI[park].GetWaitTimes && typeof(DisneyAPI[park].GetWaitTimes) == "function") {
    console.log(park);
  }
}

// Get Magic Kingdom wait times
DisneyAPI.MagicKingdom.GetWaitTimes(function(err, data) {
  if (err) return console.error("Error fetching Magic Kingdom wait times: " + err);

  console.log(" *** Magic Kingdom Florida Wait Times ***");
  console.log(JSON.stringify(data, null, 2));

  // Get Disneyland Paris park schedule
  DisneyAPI.DisneylandParis.GetSchedule(function(err, data) {
    if (err) return console.error("Error fetching Disneyland Paris schedule: " + err);

    console.log(" *** Magic Kingdom Paris Schedule ***");
    console.log(JSON.stringify(data, null, 2));
  });
});