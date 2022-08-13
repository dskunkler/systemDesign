"use strict";
exports.__esModule = true;
var app_1 = require("./app");
var http = require("http");
require("dotenv/config");
var port = process.env.APP_PORT;
app_1["default"].set('port', port);
var server = http.createServer(app_1["default"]);
server.listen(port);
server.on('listening', function () {
    var addr = server.address();
    if (addr == null) {
        throw new Error('Its borked');
    }
    var bind = typeof addr === 'string' ? "pipe ".concat(addr) : "port ".concat(addr.port);
    console.log("Listening on ".concat(bind));
});
module.exports = app_1["default"];
