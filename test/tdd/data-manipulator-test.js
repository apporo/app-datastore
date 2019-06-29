'use strict';

var devebot = require('devebot');
var lodash = devebot.require('lodash');
var assert = require('chai').assert;
var sinon = require('sinon');
var dtk = require('../index');

describe('data-manipulator', function() {
  describe('pickNormalFields()', function() {
    var DataManipulator, pickNormalFields;

    beforeEach(function() {
      DataManipulator = dtk.acquire('data-manipulator');
      pickNormalFields = dtk.get(DataManipulator, 'pickNormalFields');
    });
  });

  describe('wrap()', function() {
    var loggingFactory = dtk.createLoggingFactoryMock({ captureMethodCall: false });
    var ctx = {
      L: loggingFactory.getLogger(),
      T: loggingFactory.getTracer(),
      blockRef: 'app-datastore',
    }

    var DataManipulator, wrap;

    beforeEach(function() {
      DataManipulator = dtk.acquire('data-manipulator');
      wrap = dtk.get(DataManipulator, 'wrap');
    });

    it('always invokes getRequestTracer, beginTracing, endTracing functions');
  });
});
