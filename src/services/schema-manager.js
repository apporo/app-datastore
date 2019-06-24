'use strict';

const Devebot = require('devebot');
const lodash = Devebot.require('lodash');
const loader = Devebot.require('loader');

const TRANSFORMATION_NAMES = ['transformInput', 'transformOutput', 'transformError'];

function SchemaManager(params = {}) {
  const { mongoAccessor } = params;
  const pluginCfg = params['sandboxConfig'] || {};
  const modelMap = {};
  const transformationMap = {};

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
};

SchemaManager.referenceHash = {
  mongoAccessor: 'mongoose#manipulator'
};

module.exports = SchemaManager;
