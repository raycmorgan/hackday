var http = require('http');
var url = require('url');
var sys = require('sys');
http.createServer(function (req, res) {
	var parsedUrl = null;
	
	try
	{
		parsedUrl = url.parse(req.url, true);
		sys.puts('parsedUrl=' + sys.inspect(parsedUrl,false));
		var proxy = http.createClient(80, req.headers['host']);
		var proxyRequest = proxy.request(req.method, parsedUrl.pathname, req.headers['host']);
		sys.puts("proxyReqeust created");
		proxyRequest.addListener('res', function (proxyResponse) {
			proxyResponse.addListener('data', function(chunk) {
				res.write(chunk, 'binary');
			});
			proxyResponse.addListener('end', function() {
				res.end();
			});
			res.writeHead(proxyResponse.statusCode, proxyResponse.headers);
		});
		sys.puts("listener added to proxyRequest");
		req.addListener('end', function() {
			res.end();
		});
		req.addListener('end', function() {
			proxyRequest.end();
		});
	}
	catch (error) 
	{
		sys.puts("Error: " + error);
	}
}).listen(8124, "127.0.0.1");
console.log('Server running at http://127.0.0.1:8124/');

