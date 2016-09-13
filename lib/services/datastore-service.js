'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var Devebot = require('devebot');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var debuglog = debug('datastore');

var skydata = require('skydata');

var Service = function(params) {
  debuglog(' + constructor begin ...');

  Service.super_.apply(this);

  params = params || {};

  var self = this;

  self.getSandboxName = function() {
    return params.sandboxName;
  };

  self.logger = params.loggingFactory.getLogger();

  var datamodelService = params.datamodelService;
  var webserverTrigger = params.webserverTrigger;

  var express = webserverTrigger.getExpress();
  var server = webserverTrigger.getServer();
  var position = webserverTrigger.getPosition();

  var pluginCfg = lodash.get(params, ['sandboxConfig', 'plugins', 'appDatastore'], {});
  debuglog(' - appDatastore config: %s', JSON.stringify(pluginCfg, null, 2));

  var app = express();
  webserverTrigger.inject(app, '/datastore', position.inRangeOfMiddlewares(), 'datastore');

  self.getServiceInfo = function() {
    return {};
  };

  debuglog(' - constructor end!');
};

Service.argumentSchema = {
  "id": "datastoreService",
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
    },
    "datamodelService": {
      "type": "object"
    },
    "webserverTrigger": {
      "type": "object"
    }
  }
};

util.inherits(Service, events.EventEmitter);

module.exports = Service;
