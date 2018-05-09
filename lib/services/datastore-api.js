'use strict';

var events = require('events');
var util = require('util');
var fs = require('fs');
var path = require('path');

var Devebot = require('devebot');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var debuglog = debug('appDatastore:api');

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

    router.route('/:apiVersion/:collectionName').get(function(req, res, next) {
      self.logger.debug('Req[%s] - GET [/%s]', req.traceRequestId, req.params.collectionName);
      res.json({});
    });

    router.route('/:apiVersion/:collectionName').post(function(req, res, next) {
      self.logger.debug('Req[%s] - PUT [/%s]', req.traceRequestId, req.params.collectionName);
      res.json({});
    });

    router.route('/:apiVersion/:collectionName/:id').get(function(req, res, next) {
      self.logger.debug('Req[%s] - GET [/%s/%s]', req.traceRequestId, req.params.collectionName, req.params.id);
      debuglog(' - load schema from schema database');
      debuglog(' - identify the storage connection information');
      debuglog(' - make the connection to storage to query/manipulation data');
      debuglog(' - verify the schema');
      debuglog(' - execute the triggers');
      res.json({});
    });

    router.route('/:apiVersion/:collectionName/:id').put(function(req, res, next) {
      self.logger.debug('Req[%s] - PUT [/%s]', req.traceRequestId, req.params.collectionName);
      res.json({});
    });

    router.route('/:apiVersion/:collectionName/:id').patch(function(req, res, next) {
      self.logger.debug('Req[%s] - PUT [/%s]', req.traceRequestId, req.params.collectionName);
      res.json({});
    });

    router.route('/:apiVersion/:collectionName/:id').delete(function(req, res, next) {
      self.logger.debug('Req[%s] - PUT [/%s]', req.traceRequestId, req.params.collectionName);
      res.json({});
    });

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
  "id": "datastoreApi",
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
