'use strict';

var path = require('path');

var app = require('devebot').launchApplication({
  appRootPath: __dirname
}, [{
  name: 'app-datastore',
  path: path.join(__dirname, '../../index.js')
}]);

if (require.main === module) app.server.start();

process.on('SIGINT', function() {
  app.server.stop().then(function () {
    console.log("The server has been stopped.");
  });
});

module.exports = app;
