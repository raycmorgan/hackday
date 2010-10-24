var dgram = require("dgram");
var serverPath = "/tmp/dgram_server_sock";
var server = dgram.createSocket("unix_dgram");
var redis = require("./node_redis");
var sys = require("sys");
var http = require('http');

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


http.createServer(function (request, response) {
  response.writeHead(200, {});
  
  r.get('hits:CoreValue', function (err, res) {
    response.end(res);
  });
}).listen(8000);
