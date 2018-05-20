'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const chores = Devebot.require('chores');
const lodash = Devebot.require('lodash');
const loader = Devebot.require('loader');
const path = require('path');

function SchemaManager(params) {
  params = params || {};

  let self = this;
  let LX = params.loggingFactory.getLogger();
  let LT = params.loggingFactory.getTracer();
  let packageName = params.packageName || 'app-datastore';
  let blockRef = chores.getBlockRef(__filename, packageName);

  LX.has('silly') && LX.log('silly', LT.toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + constructor start ...'
  }));

  let pluginCfg = params['sandboxConfig'];
  let mongoAccessor = params['mongoose#manipulator'];
  let modelMap = {};

  this.hasModel = function(name) {
    return name in modelMap;
  }

  this.getModel = function(name) {
    return modelMap[name];
  }

  this.addModel = function(name, descriptor, options) {
    if (lodash.isString(options)) {
      options = { collection: options }
    }
    var model = mongoAccessor.registerModel(name, descriptor, options);
    modelMap[name] = model;
    return model;
  }

  if (pluginCfg.autowired !== false) {
    let mappings = loader(pluginCfg.mappingStore);
    lodash.forEach(mappings, function(mapping) {
      self.addModel(mapping.name, mapping.descriptor, mapping.options);
    });
  }

  LX.has('silly') && LX.log('silly', LT.toMessage({
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor has finished'
  }));
};

SchemaManager.referenceList = [
  'mongoose#manipulator'
];

module.exports = SchemaManager;
