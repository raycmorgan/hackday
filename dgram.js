var dgram = require("dgram");
var serverPath = "/tmp/dgram_server_sock";
var server = dgram.createSocket("unix_dgram");
var redis = require("./redis-client");
var sys = require("sys");

server.on("message", function (msg, rinfo) {
  console.log("got: " + msg + " from " + rinfo.address);
});

server.on("message", function(data) {
	console.log("got some data");
	var r = redis.createClient();
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
