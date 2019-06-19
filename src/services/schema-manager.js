'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const chores = Devebot.require('chores');
const lodash = Devebot.require('lodash');
const loader = Devebot.require('loader');

const TRANSFORMATION_NAMES = ['transformInput', 'transformOutput', 'transformError'];

function SchemaManager(params = {}) {
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
  let transformationMap = {};

  this.hasModel = function(name) {
    return name in modelMap;
  }

  this.getModel = function(name) {
    return modelMap[name];
  }

  this.getTransformer = function(name, methodName) {
    return transformationMap[name] && transformationMap[name][methodName] || {};
  }

  this.addModel = function(name, descriptor, options) {
    if (lodash.isString(options)) {
      options = { collection: options }
    }
    var model = mongoAccessor.registerModel(name, descriptor, options);
    modelMap[name] = model;
    return model;
  }

  this.register = function(args) {
    args = args || {};
    let {name, descriptor, options, interceptors} = args;
    if (lodash.isString(options)) {
      options = { collection: options }
    }
    var model = mongoAccessor.registerModel(name, descriptor, options);
    modelMap[name] = model;
    transformationMap[name] = transformationMap[name] || {};
    lodash.forEach(interceptors, function(interceptor) {
      let {methodName} = interceptor;
      if (lodash.isString(methodName)) {
        transformationMap[name][methodName] = transformationMap[name][methodName] || {};
        lodash.forOwn(lodash.omit(interceptor, ['methodName']), function(func, fname) {
          if (TRANSFORMATION_NAMES.indexOf(fname) >= 0 && lodash.isFunction(func)) {
            transformationMap[name][methodName][fname] = func;
          }
        });
      }
    });
    return true;
  }

  if (pluginCfg.autowired !== false) {
    lodash.forEach(loader(pluginCfg.mappingStore), this.register);
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
