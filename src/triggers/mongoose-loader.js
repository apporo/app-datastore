'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');

function Servlet(params = {}) {
  const { mongoAccessor } = params;
  let connected = false;

  this.start = function() {
    params.mongoAccessor.getConnection();
    connected = true;
    return Promise.resolve();
  };

  this.stop = function() {
    if (connected) {
      let p = mongoAccessor.disconnect();
      p = p.then(function() {
        connected = false;
        return null;
      });
      return p;
    }
    return Promise.resolve();
  };
};

Servlet.referenceHash = {
  mongoAccessor: 'mongoose#manipulator'
};

module.exports = Servlet;
