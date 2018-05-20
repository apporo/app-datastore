'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const chores = Devebot.require('chores');
const lodash = Devebot.require('lodash');
const path = require('path');
const SPECIAL_FIELDS = ['_id', '__v'];

function DataManipulator(params) {
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
  let schemaManager = params['schemaManager'];
  let mongoAccessor = params['mongoose#manipulator'];
  let normalFieldsOf = {};

  let getModel = function(name) {
    let model = schemaManager.getModel(name);
    if (!model) return Promise.reject(name);
    return Promise.resolve(model);
  }

  var pickNormalFields = function (model, excluded) {
    excluded = excluded || SPECIAL_FIELDS;
    var fields = [];
    model.schema.eachPath(function (path) {
      lodash.isArray(excluded) ? excluded.indexOf(path) < 0 ? fields.push(path) : false : path === excluded ? false : fields.push(path);
    });
    return fields;
  };

  this.find = function(args, opts) {
    args = args || {};
    let {query={}, projection={}, options={}, from, size} = args;
    options.skip = options.skip || from;
    options.limit = options.limit || size;
    let flow = getModel(args.type);
    flow = flow.then(function(model) {
      var p_find = Promise.promisify(model.find, {context: model});
      return p_find(query, projection, options);
    });
    return flow;
  }

  this.get = function(args, opts) {
    args = args || {};
    let flow = getModel(args.type);
    flow = flow.then(function(model) {
      var p_findById = Promise.promisify(model.findById, {context: model});
      return p_findById(args.id);
    });
    return flow;
  }

  this.create = function(args, opts) {
    args = args || {};
    let data = args.data;
    let flow = getModel(args.type);
    flow = flow.then(function(model) {
      var object = new model(lodash.pick(data, pickNormalFields(model)));
      return Promise.promisify(object.save, {context: object})();
    });
    return flow;
  }

  this.update = function(args, opts) {
    args = args || {};
    let _id = args.data && args.data._id || args._id || args.id;
    let data = args.data;
    let flow = getModel(args.type);
    flow = flow.then(function(model) {
      let _update = Promise.promisify(model.update, {context: model});
      return _update({_id: _id}, lodash.pick(data, pickNormalFields(model)));
    });
    return flow;
  }

  this.delete = function(args, opts) {
    args = args || {};
    let _id = args.data && args.data._id || args._id || args.id;
    let flow = getModel(args.type);
    flow = flow.then(function(model) {
      let _delete = Promise.promisify(model.remove, {context: model});
      return _delete({_id: _id});
    });
    return flow;
  }

  LX.has('silly') && LX.log('silly', LT.toMessage({
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor has finished'
  }));
};

DataManipulator.referenceList = [
  'schemaManager',
  'mongoose#manipulator'
];

module.exports = DataManipulator;
