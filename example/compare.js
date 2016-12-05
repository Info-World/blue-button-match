var match = require("../index.js");
var bunyan = require("bunyan");

var log = bunyan.createLogger({
    name: "log",
    streams: [{
        level: "debug",
        path: "./log.log",
        period: "1d",
        count: "7"
    }, {
        level: "error",
        stream: process.stdout
    }
    ]
});

// files to compare
var binary = require("./binary2.json");
var everything = require("./everything2.json");

var result = match.match(binary, everything, log);

console.log(JSON.stringify(result, null, 4));