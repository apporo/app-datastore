'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');

function Servlet(params = {}) {
  const { sandboxConfig, mongoAccessor } = params;

  this.start = function() {
    if (sandboxConfig.isLazyLoad !== true) {
      return mongoAccessor.getConnection();
    }
    return Promise.resolve();
  };

  this.stop = function() {
    return mongoAccessor.disconnect();
  };
};

Servlet.referenceHash = {
  mongoAccessor: 'mongoose#manipulator'
};

module.exports = Servlet;
