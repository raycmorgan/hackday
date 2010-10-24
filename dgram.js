var dgram = require("dgram");
var serverPath = "/tmp/dgram_server_sock";
var server = dgram.createSocket("udp4");
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
			data = "hits/" + data;
			var key = data.replace(/\//g, ":");
			var parts = key.split(":");
			var newKey = "";
			parts.forEach(function (item, i) {
				if (i > 0) { newKey += ":";}
				newKey += item;
				r.incr(newKey, function(err, total) {
					console.log(newKey + " stored with count " + total);	
				});
				if (parts[i+1]) {
					var hits = "sets:" + newKey;
					console.log("Set = " + hits);
					r.sadd(hits, newKey + ":" + parts[i+1],
						function() {
							console.log(newKey + ":" + parts[i+1] + " added to " + hits);
					});
				}
			});
		r.incr(key, function(err, count) {
				sys.puts(key + " stored with id " + count);	
		});
		r.sadd("endpoints", key, function() {
			console.log("Added " + key + " to Set");
		});
});

server.on("listening", function () {
  console.log("server listening " + server.address().address);
})
server.bind(8001);

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
