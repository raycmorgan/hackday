var http = require('http');
var dgram = require("dgram");
var serverPath = "/tmp/dgram_server_sock";
var url = require('url');

var client = dgram.createSocket("udp4");

http.createServer(function(request, response) {
  var host = request.headers['host'];
  var proxy = http.createClient(80, host);
  console.log("proxy_request logged for " + request.url + " to " + host);

  if (host != null) {
    var proxy_request = proxy.request(request.method, request.url, request.headers);

    proxy_request.addListener('response', function (proxy_response) { 
      var urlObj = url.parse(request.url);
      var message = new Buffer(host + urlObj.pathname + "/" + request.method + "/" + proxy_response.statusCode);
      client.send(message, 0, message.length,8001, "localhost");
      
      response.writeHead(proxy_response.statusCode, proxy_response.headers);
      
      proxy_response.addListener('data', function(chunk) {
        response.write(chunk, 'binary');
      });
        
      proxy_response.addListener('end', function() {
        response.end();
      });
      
    });
      
    request.addListener('data', function(chunk) {
      proxy_request.write(chunk, 'binary');
    });
      
    request.addListener('end', function() {
      proxy_request.end();
      proxy_request = null;
    });
  }
}).listen(8080);

