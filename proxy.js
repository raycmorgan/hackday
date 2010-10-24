var http = require('http');
var sys = require('sys');
var dgram = require("dgram");
var serverPath = "/tmp/dgram_server_sock";

http.createServer(function(request, response) {
try {
  var proxy = http.createClient(80, request.headers['host'])
  var proxy_request = proxy.request(request.method, request.url, request.headers);
var client = dgram.createSocket("unix_dgram");
var message = new Buffer(request.url);
client.send(message, 0, message.length, serverPath);

  proxy_request.addListener('response', function (proxy_response) { proxy_response.addListener('data', function(chunk) {
      response.write(chunk, 'binary');
    });
    proxy_response.addListener('end', function() {
      response.end();
    });
    response.writeHead(proxy_response.statusCode, proxy_response.headers);
  });
  request.addListener('data', function(chunk) {
    proxy_request.write(chunk, 'binary');
  });
  request.addListener('end', function() {
    proxy_request.end();
  });
}
catch (error) {
	sys.puts("Error = " + error);
}
}).listen(8080);

