// Debug Viewer
//  Usage:
//   var debugger = require("./debugView");
//   debugger.StartSection("my_section");
//   debugger.RecordHTTPRequest("my_request", reqObj, responseData);
//   debugger.EndSection();

var fs = require("fs");
var path = require("path");

module.exports = {
  StartSection: StartSection,
  EndSection: EndSection,
  RecordHTTPRequest: RecordHTTPRequest,
  Log: LogMessage,
};

// list of debug assets we've stored
var debugAssets = {
  name: "Debug View",
  children: [],
};

var sectionStack = [debugAssets];

function StartSection(section_name) {
  // create new section
  sectionStack.push({
    name: section_name,
    children: [],
  });

  sectionStack[sectionStack.length - 2].children.push(sectionStack[sectionStack.length - 1]);
}

function EndSection() {
  if (sectionStack.length > 1) sectionStack.pop();
}

function RecordHTTPRequest(name, data) {
  sectionStack[sectionStack.length - 1].children.push({
    name: name,
    request: data,
    datetime: Date.now(),
  });
}

// log an arbitrary message to the debug view
function LogMessage() {
  sectionStack[sectionStack.length - 1].children.push({
    name: "LOG",
    message: Array.prototype.slice.call(arguments),
    datetime: Date.now(),
  });
}

function WriteDebugFile() {
  if (process.env.DEBUGOUT) {
    fs.writeFileSync(
      path.join(__dirname, path.basename(process.env.DEBUGOUT, ".json") + ".json"),
      JSON.stringify(debugAssets, null, 2)
    );
  }
}

process.on('exit', WriteDebugFile.bind());
process.on('SIGINT', WriteDebugFile.bind());
process.on('uncaughtException', WriteDebugFile.bind());