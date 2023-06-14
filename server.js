/*
This is auto generated boilerplate, we can remove it or modify it
-Drew
*/
"use strict";
var http = require("http");
var port = process.env.PORT || 1337;

http
  .createServer(function (req, res) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello World\n");
  })
  .listen(port);

// comment by Ed
