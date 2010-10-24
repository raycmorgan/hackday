var dgram = require("dgram");
var serverPath = "/tmp/dgram_server_sock";
var server = dgram.createSocket("unix_dgram");
var redis = require("./node_redis");
var sys = require("sys");
var http = require('http');
var fs   = require('fs');
var ws   = require('./node-websocket-server/lib/ws');

var r = redis.createClient(6379, '192.168.10.211');

server.on("message", function (msg, rinfo) {
  console.log("got: " + msg + " from " + rinfo.address);
});

server.on("message", function(data) {
	console.log("got some data");
	r.stream.on('connect', function() {
			data = "hits" + data;
			var key = data.replace(/\//g, ":");
		r.incr(key, function(err, count) {
				sys.puts(key + " stored with id " + count);	
		});
	});
	r.close();
});

server.on("listening", function () {
  console.log("server listening " + server.address().address);
})

server.bind(serverPath);


var httpServer = http.createServer(function (request, response) {
  response.writeHead(200, {});
  
  fs.readFile(__dirname + request.uri, function (err, contents) {
    if (err) {
      
    } else {
      response.writeHead(200, {'content-length': contents.length});
      
    }
  });
  
  // r.get('hits:CoreValue', function (err, res) {
  //   response.end(res);
  // });
});

var wsServer = ws.createServer({server: httpServer});

wsServer.addListener('connection', function (connection) {});
wsServer.addListener('close', function (connection) {});

wsServer.listen(8000);
