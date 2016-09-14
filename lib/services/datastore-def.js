'use strict';

var events = require('events');
var util = require('util');
var fs = require('fs');
var path = require('path');

var Devebot = require('devebot');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var debuglog = debug('appDatastore:def');

var Service = function(params) {
  debuglog(' + constructor begin ...');

  Service.super_.apply(this);
  params = params || {};
  var self = this;
  self.logger = params.loggingFactory.getLogger();

  var cfgPlugin = lodash.get(params, ['sandboxConfig', 'plugins', 'appDatastore'], {});

  self.getSandboxName = function() {
    return params.sandboxName;
  };

  self.buildRestRouter = function(express) {
    var router = express.Router();

    return router;
  };

  self.getServiceInfo = function() {
    return {};
  };

  self.getServiceHelp = function() {
    return {};
  };

  debuglog(' - constructor end!');
};

Service.argumentSchema = {
  "id": "datastoreDef",
  "type": "object",
  "properties": {
    "sandboxName": {
      "type": "string"
    },
    "sandboxConfig": {
      "type": "object"
    },
    "profileConfig": {
      "type": "object"
    },
    "generalConfig": {
      "type": "object"
    },
    "loggingFactory": {
      "type": "object"
    }
  }
};

util.inherits(Service, events.EventEmitter);

module.exports = Service;
