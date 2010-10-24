var spawn = require('child_process').spawn;

(function boot() {
  var proxy = spawn('node', ['proxy.js']);

  proxy.on('exit', function () {
    process.nextTick(boot);
  });
  
  proxy.stdout.on('data', function (data) {
    console.log(data);
  });
}());
