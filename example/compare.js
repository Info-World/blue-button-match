var match = require("../index.js");

// files to compare
var binary = require("./binary2.json");
var everything = require("./everything2.json");

var result = match.match(binary, everything);

console.log(JSON.stringify(result, null, 4));