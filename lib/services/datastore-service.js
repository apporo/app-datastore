'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var Devebot = require('devebot');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var debuglog = debug('appDatastore:service');

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

  var contextPath = pluginCfg.contextPath || '/datastore';

  webserverTrigger.inject(params.datastoreApi.buildRestRouter(express),
      contextPath + '/api', position.inRangeOfMiddlewares(), 'datastore-api');

  webserverTrigger.inject(params.datastoreDef.buildRestRouter(express),
      contextPath + '/def', position.inRangeOfMiddlewares(), 'datastore-def');

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
    "datastoreApi": {
      "type": "object"
    },
    "datastoreDef": {
      "type": "object"
    },
    "webserverTrigger": {
      "type": "object"
    }
  }
};

util.inherits(Service, events.EventEmitter);

module.exports = Service;
