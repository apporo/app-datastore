'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');

function Servlet(params = {}) {
  const mongooseManipulator = params['mongoose#manipulator'];
  let connected = false;

  this.start = function() {
    mongooseManipulator.getConnection();
    connected = true;
    return Promise.resolve();
  };

  this.stop = function() {
    if (connected) {
      let p = mongooseManipulator.disconnect();
      p = p.then(function() {
        connected = false;
        return null;
      });
      return p;
    }
    return Promise.resolve();
  };
};

Servlet.referenceList = [ "mongoose#manipulator" ];

module.exports = Servlet;
