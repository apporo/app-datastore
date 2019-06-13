'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const lodash = Devebot.require('lodash');

function Servlet(params) {
  params = params || {};

  var mongooseManipulator = params['mongoose#manipulator'];

  this.start = function() {
    mongooseManipulator.getConnection();
    return Promise.resolve();
  };

  this.stop = function() {
    if (mongooseManipulator != null) {
      let p = mongooseManipulator.disconnect();
      p = p.then(function() {
        return mongooseManipulator = null;
      });
      return p;
    }
    return Promise.resolve();
  };
};

Servlet.referenceList = [ "mongoose#manipulator" ];

module.exports = Servlet;
