'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var _ = require('devebot').pkg.lodash;
var debuglog = require('devebot').debug('datastore');
var deployd = require('deployd');

var Service = function(params) {
  Service.super_.call(this);

  params = params || {};

  var self = this;
  
  self.getSandboxName = function() {
    return params.sandboxname;
  };
  
  var sandboxconfig = params.sandboxconfig;
  
  var loggingFactory = params.loggingFactory;
  self.logger = loggingFactory.getLogger();
  
  var datamodelService = params.datamodelService;
  var webserverTrigger = params.webserverTrigger;

  var apporo = webserverTrigger.getApporo();
  var express = webserverTrigger.getExpress();
  var server = webserverTrigger.getServer();

  var configDB = _.defaults(_.get(params, 'profileconfig.datastore.mongodb', {}), {
    host: 'localhost', 
    port: 27017, 
    name: 'devebot-datastore'
  });

  var middleware = express();
  var io = require('socket.io').listen(server, {'log level': 0});
  deployd.attach(server, {
    db: configDB,
    socketIo: io,
    env: process.env.NODE_ENV || 'development'
  });
  middleware.use(server.handleRequest);

  apporo.use(middleware);

  self.getServiceInfo = function() {
    return {};
  };
};

Service.argumentSchema = {
  "id": "/datastoreService",
  "type": "object",
  "properties": {
    "sandboxname": {
      "type": "string"
    },
    "sandboxconfig": {
      "type": "object"
    },
    "profileconfig": {
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
