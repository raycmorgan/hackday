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
  
  fs.readFile(__dirname + request.url, function (err, contents) {
    if (err) {
      response.writeHead(404, {});
      response.end('404');
    } else {
      response.writeHead(200);
      response.end(contents);
    }
  });
  
  // r.get('hits:CoreValue', function (err, res) {
  //   response.end(res);
  // });
});

// // // // // // CRAPPY CODE FOLLOWS // // // // // //

var wsServer = ws.createServer({server: httpServer});

wsServer.addListener('connection', function (connection) {
  var interval;
  
  connection.addListener('message', function (data) {
    data = JSON.parse(data);
    
    if (data.node) {
      clearInterval(interval);
      
      r.smembers('sets:' + data.node, function (err, res) {
        if (res) {
          res = res.map(function (item) { return item.toString(); });
          
          connection.send(JSON.stringify({type: 'node', sets: res}));
          
          interval = setInterval(function () {
            res.forEach(function (endpoint) {
              
              r.get(endpoint, function (err, res) {
                if (res) {
                  var res = parseInt(res.toString());
                  var num = res.toString() - endpoints[endpoint];
                  wsServer.broadcast(JSON.stringify({endpoint: endpoint, amount: num}));
                  endpoints[endpoint] = res;
                }
              });
              
            });
          }, 500);
        }
      });
    }
  });
});
wsServer.addListener('close', function (connection) {});

wsServer.listen(8000);

var endpoints = {'hits:Info': 0};

function getEndpoints() {
  r.smembers('endpoints', function (err, res) {
    if (res) {
      res.forEach(function (item) {
        if (!endpoints[item]) {
          endpoints[item] = 0;
        }
      });
    }
  });
}
getEndpoints();
setInterval(getEndpoints, 5000);

// setInterval(function () {
//   for (var k in endpoints) {
//     (function (k) {
//       r.get(k, function (err, res) {
//         if (res) {
//           var res = parseInt(res.toString());
//           var num = res.toString() - endpoints[k];
//           wsServer.broadcast(JSON.stringify({endpoint: k, amount: num}));
//           endpoints[k] = res;
//         }
//       });
//     }(k));
//   }
// }, 500);
