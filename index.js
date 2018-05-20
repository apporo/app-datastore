'use strict';

var plugin = require('devebot').registerLayerware(__dirname, [], [
  'devebot-co-mongoose'
]);

var builtinPackages = [
  'mongoose'
];

plugin.require = function(packageName) {
	if (builtinPackages.indexOf(packageName) >= 0) return require(packageName);
	return null;
};

module.exports = plugin;
