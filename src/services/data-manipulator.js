'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const chores = Devebot.require('chores');
const lodash = Devebot.require('lodash');
const SPECIAL_FIELDS = ['_id', '__v'];

function DataManipulator(params) {
  params = params || {};

  let self = this;
  let LX = params.loggingFactory.getLogger();
  let TR = params.loggingFactory.getTracer();
  let packageName = params.packageName || 'app-datastore';
  let blockRef = chores.getBlockRef(__filename, packageName);

  LX.has('silly') && LX.log('silly', TR.toMessage({
    tags: [blockRef, 'constructor-begin'],
    text: ' + constructor start ...'
  }));

  let pluginCfg = params['sandboxConfig'];
  let schemaManager = params['schemaManager'];
  let mongoAccessor = params['mongoose#manipulator'];

  let getRequestId = function (opts) {
    return (opts.requestId = opts.requestId || TR.getLogID());
  }

  let getRequestTracer = function (opts) {
    return TR.branch({ key: 'requestId', value: getRequestId(opts) });
  }

  let beginTracing = function (tracer, methodName) {
    LX.has('debug') && LX.log('debug', tracer.add({ methodName }).toMessage({
      tags: [blockRef, methodName, 'begin'],
      text: ' - [${requestId}] ${methodName}() begin'
    }));
  }

  let endTracing = function (tracer, methodName, args, opts, flow) {
    return flow.then(function (result) {
      LX.has('debug') && LX.log('debug', tracer.add({ methodName }).toMessage({
        tags: [blockRef, methodName, 'completed'],
        text: ' - [${requestId}] ${methodName}() has completed'
      }));
      return result;
    }).catch(function (error) {
      LX.has('error') && LX.log('error', tracer.add({ methodName, error }).toMessage({
        tags: [blockRef, methodName, 'failed'],
        text: ' - [${requestId}] ${methodName}() has failed. Error: ${error}'
      }));
      return Promise.reject(error);
    });
  }

  let wrap = function (methodName, args, opts, main) {
    args = args || {};
    opts = opts || {};
    let reqTr = getRequestTracer(opts);
    beginTracing(reqTr, methodName);
    let transformer = schemaManager.getTransformer(args.type, methodName);
    if (transformer && lodash.isFunction(transformer.transformInput)) {
      args = transformer.transformInput(args, opts);
    }
    let flow = Promise.resolve().then(lodash.wrap(main(reqTr, args, opts)));
    if (transformer) {
      flow = flow.then(function (result) {
        if (lodash.isFunction(transformer.transformOutput)) {
          return transformer.transformOutput(result, args, opts);
        }
        return result;
      }).catch(function (error) {
        if (transformer && lodash.isFunction(transformer.transformError)) {
          throw transformer.transformError(error, args, opts);
        }
        throw error;
      });
    }
    return endTracing(reqTr, methodName, args, opts, flow);
  }

  let getModel = function (name) {
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

  this.find = function (args, opts) {
    return wrap('find', args, opts, function (reqTr, args, opts) {
      let { query = {}, projection = {}, options = {}, populates = [], from, size } = args;
      options.skip = options.skip || from;
      options.limit = options.limit || size;
      let flow = getModel(args.type);
      flow = flow.then(function (model) {
        var doc = model.find(query, projection, options);
        if (populates) {
          populates.forEach(function (polulateArgs) {
            doc.populate(polulateArgs);
          });
        }
        return Promise.resolve(doc.exec());
      });
      return flow;
    });
  }

  this.findOne = function (args, opts) {
    return wrap('findOne', args, opts, function (reqTr, args, opts) {
      let { query = {}, projection = {}, options = {} } = args;
      let flow = getModel(args.type);
      flow = flow.then(function (model) {
        var doc = model.findOne(query, projection, options);
        if (populates) {
          doc.populate(populates);
        }
        return Promise.resolve(doc.exec());
      });
      return flow;
    });
  }

  this.get = function (args, opts) {
    return wrap('get', args, opts, function (reqTr, args, opts) {
      let { populates = [] } = args;
      let flow = getModel(args.type);
      flow = flow.then(function (model) {
        var doc = model.findById(args.id);
        if (populates) {
          doc.populate(populates);
        }
        return Promise.resolve(doc.exec());
      });
      return flow;
    });
  }

  this.count = function(args, opts) {
    args = args || {};
    let {filter={}} = args;
    let flow = getModel(args.type);
    flow = flow.then(function(model) {
      var p_count = Promise.promisify(model.count, {context: model});
      return p_count(filter);
    })
    return flow;
  }

  this.create = function (args, opts) {
    return wrap('create', args, opts, function (reqTr, args, opts) {
      let data = args.data;
      let flow = getModel(args.type);
      flow = flow.then(function (model) {
        var object = new model(lodash.pick(data, pickNormalFields(model)));
        return Promise.promisify(object.save, { context: object })();
      });
      return flow;
    });
  }

  this.update = function (args, opts) {
    return wrap('update', args, opts, function (reqTr, args, opts) {
      let _id = args.data && args.data._id || args._id || args.id;
      let data = args.data;
      let flow = getModel(args.type);
      flow = flow.then(function (model) {
        let _update = Promise.promisify(model.update, { context: model });
        return _update({ _id: _id }, lodash.pick(data, pickNormalFields(model)));
      });
      return flow;
    });
  }

  this.delete = function (args, opts) {
    return wrap('delete', args, opts, function (reqTr, args, opts) {
      let _id = args.data && args.data._id || args._id || args.id;
      let flow = getModel(args.type);
      flow = flow.then(function (model) {
        let _delete = Promise.promisify(model.remove, { context: model });
        return _delete({ _id: _id });
      });
      return flow;
    });
  }

  LX.has('silly') && LX.log('silly', TR.toMessage({
    tags: [blockRef, 'constructor-end'],
    text: ' - constructor has finished'
  }));
};

DataManipulator.referenceList = [
  'schemaManager',
  'mongoose#manipulator'
];

module.exports = DataManipulator;
