'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const chores = Devebot.require('chores');
const lodash = Devebot.require('lodash');
const SPECIAL_FIELDS = ['_id', '__v'];

function DataManipulator(params = {}) {
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();
  const blockRef = chores.getBlockRef(__filename, params.packageName || 'app-datastore');
  const ctx = { L, T, blockRef };

  const schemaManager = params['schemaManager'];

  const wrap = function (methodName, args = {}, opts = {}, main) {
    const reqTr = getRequestTracer(ctx, opts);
    beginTracing(ctx, reqTr, methodName);
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
    return endTracing(ctx, reqTr, methodName, args, opts, flow);
  }

  const getModel = function (name) {
    let model = schemaManager.getModel(name);
    if (!model) return Promise.reject(name);
    return Promise.resolve(model);
  }

  const pickNormalFields = function (model, excluded) {
    excluded = excluded || SPECIAL_FIELDS;
    let fields = [];
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
        let doc = model.find(query, projection, options);
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
        let doc = model.findOne(query, projection, options);
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
        let doc = model.findById(args.id);
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
      let p_count = Promise.promisify(model.countDocuments, {context: model});
      return p_count(filter);
    })
    return flow;
  }

  this.create = function (args, opts) {
    return wrap('create', args, opts, function (reqTr, args, opts) {
      let data = args.data;
      let flow = getModel(args.type);
      flow = flow.then(function (model) {
        let object = new model(lodash.pick(data, pickNormalFields(model)));
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
};

DataManipulator.referenceList = [
  'schemaManager',
];

module.exports = DataManipulator;

function getRequestId(ctx = {}, opts) {
  const { T } = ctx;
  return (opts.requestId = opts.requestId || T.getLogID());
}

function getRequestTracer(ctx = {}, opts) {
  const { T } = ctx;
  return T.branch({ key: 'requestId', value: getRequestId(ctx, opts) });
}

function beginTracing(ctx = {}, tracer, methodName) {
  const { L, blockRef } = ctx;
  L.has('debug') && L.log('debug', tracer.add({ methodName }).toMessage({
    tags: [blockRef, methodName, 'begin'],
    text: ' - [${requestId}] ${methodName}() begin'
  }));
}

function endTracing(ctx = {}, tracer, methodName, args, opts, flow) {
  const { L, blockRef } = ctx;
  return flow.then(function (result) {
    L.has('debug') && L.log('debug', tracer.add({ methodName }).toMessage({
      tags: [blockRef, methodName, 'completed'],
      text: ' - [${requestId}] ${methodName}() has completed'
    }));
    return result;
  }).catch(function (error) {
    L.has('error') && L.log('error', tracer.add({ methodName, error }).toMessage({
      tags: [blockRef, methodName, 'failed'],
      text: ' - [${requestId}] ${methodName}() has failed. Error: ${error}'
    }));
    return Promise.reject(error);
  });
}
