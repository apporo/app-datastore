'use strict';

const Devebot = require('devebot');
const lodash = Devebot.require('lodash');
const chores = Devebot.require('chores');

const BUILTIN_MAPPING_LOADER = chores.isVersionLTE && chores.getVersionOf &&
    chores.isVersionLTE("0.3.1", chores.getVersionOf("devebot"));

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

  this.register = function({name, descriptor, options, interceptors} = {}) {
    if (lodash.isString(options)) {
      options = { collection: options }
    }
    modelMap[name] = mongoAccessor.registerModel(name, descriptor, options);
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

  let mappingHash;
  if (BUILTIN_MAPPING_LOADER) {
    mappingHash = params.mappingLoader.loadMappings(pluginCfg.mappingStore);
  } else {
    mappingHash = loadMappings(pluginCfg.mappingStore);
  }
  const mappings = joinMappings(mappingHash);

  if (pluginCfg.autowired !== false) {
    lodash.forEach(mappings, this.register);
  }
};

SchemaManager.referenceHash = {
  mongoAccessor: 'mongoose#manipulator'
};

if (BUILTIN_MAPPING_LOADER) {
  SchemaManager.referenceHash = {
    mongoAccessor: 'mongoose#manipulator',
    mappingLoader: "devebot/mappingLoader"
  };
}

module.exports = SchemaManager;

function loadMappings (mappingStore) {
  const mappingMap = {};
  if (lodash.isString(mappingStore)) {
    let store = {};
    store[chores.getUUID()] = mappingStore;
    mappingStore = store;
  }
  if (lodash.isObject(mappingStore)) {
    lodash.forOwn(mappingStore, function(path, name) {
      mappingMap[name] = require(path);
    });
  }
  return mappingMap;
}

function joinMappings (mappingMap, mappings = []) {
  lodash.forOwn(mappingMap, function(mappingList, name) {
    mappings.push.apply(mappings, mappingList);
  });
  return mappings;
}
