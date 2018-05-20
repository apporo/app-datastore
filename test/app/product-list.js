'use strict';

var path = require('path');

var main = require('devebot').launchApplication({
  appRootPath: __dirname
}, [{
  name: 'app-datastore',
  path: path.join(__dirname, '../../index.js')
}]);

main.runner.invoke(function(injektor) {
  var sandboxManager = injektor.lookup('sandboxManager');

  var dataManipulator = sandboxManager.getSandboxService('dataManipulator', {
    scope: 'app-datastore'
  });

  dataManipulator.find({
    type: 'InfoModel',
    size: 1
  }).then(function(result) {
    console.log(result);
  });
});
