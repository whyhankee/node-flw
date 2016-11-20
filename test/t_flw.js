/* eslint-env mocha */
'use strict';
var expect = require('expect.js');
var debug = require('debug')('flw:test');

var flw = require('../flw');


describe('Context handling', function () {
  it('correct context keys', function (done) {
    return flw.series([dummyHandler], function (err, context) {
      expect(err).to.be(null);
      expect(context).to.only.have.keys([
        '_stopped',
        '_stop',
        '_store', '_flw_store',
        '_clean'
      ]);
      return done();
    });
  });

  it('_store()', function (done) {
    return flw.series([testHandler], function (err, context) {
      expect(err).to.be(null);
      expect(context.value).to.be('returnValue');
      return done();
    });

    function testHandler(c, cb) {
      return asyncOperation(c._store('value', cb));
    }
    function asyncOperation(cb) {
      return cb(null, 'returnValue');
    }
  });

  it('_stop()', function (done) {
    return flw.series([
      pre_a,
      test_stop,
      pre_b
    ], function onSeriesDone(err, context) {
      expect(err).to.be(null);
      expect(context._stopped).to.be('flw stopped ..');
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).not.to.have.property('pre_b');
      return done();
    });
  });

  it('_stop() without reason', function (done) {
    return flw.series([
      pre_a,
      test_stop_noReason,
      pre_b
    ], function onSeriesDone(err, context) {
      expect(err).to.be(null);
      expect(context._stopped).to.be('stopped');
      expect(context).not.to.have.property('pre_b');
      return done();
    });
  });

  it('_clean()', function (done) {
    return flw.series([pre_a], function (err, context) {
      expect(err).to.be(null);

      // clean returns a new object
      expect(context._clean()).to.only.have.key('pre_a');
      // context object still has the special properties
      expect(context._clean).to.be.a('function');
      return done();
    });
  });
});


describe('Basic operations', function () {

  describe('.series', function () {
    it('.series()', function (done) {
      return flw.series([
        pre_a,
        pre_b
      ], function onSeriesDone(err, context) {
        expect(err).to.be(null);
        expect(context).to.have.property('pre_a', 'pre_a');
        expect(context).to.have.property('pre_b', 'pre_b');
        return done();
      });
    });

    it('.make.series()', function (done) {
      var fn = flw.make.series([
        pre_a, 
        pre_b
      ]);
      return fn(function onMakeSeriesDone(err, context) {
        expect(err).to.be(null);
        expect(context).to.have.property('pre_a', 'pre_a');
        expect(context).to.have.property('pre_b', 'pre_b');
        return done();
      });
    });

    it('.series() with injected context', function (done) {
      var preSet = {preset: 'preset'};

      return flw.series([
        pre_a,
        pre_b
      ], preSet, function onSeriesDone(err, context) {
        expect(err).to.be(null);
        expect(context).to.have.property('preset', 'preset');
        expect(context).to.have.property('pre_a', 'pre_a');
        expect(context).to.have.property('pre_b', 'pre_b');
        return done();
      });
    });

    it('.series() - no functions', function (done) {
      return flw.series([], done);
    });
  });

  describe('.parallel', function () {
    it('.parallel()', function (done) {
      return flw.parallel([
        pre_a,
        pre_b
      ], function onParallelDone(err, context) {
        expect(err).to.be(null);
        expect(context).to.have.property('pre_a', 'pre_a');
        expect(context).to.have.property('pre_b', 'pre_b');
        return done();
      });
    });

    it('.make.parallel()', function (done) {
      var fn = flw.make.parallel([
        pre_a,
        pre_b
      ]);
      return fn(function onMakeParallelDone(err, context) {
        expect(err).to.be(null);
        expect(context).to.have.property('pre_a', 'pre_a');
        expect(context).to.have.property('pre_b', 'pre_b');
        return done();
      });
    });

    it('.parallel() with injected context', function (done) {
      var preSet = {preset: 'preset'};

      return flw.parallel([
        pre_a,
        pre_b
      ], preSet, function onSeriesDone(err, context) {
        expect(err).to.be(null);
        expect(context).to.have.property('preset', 'preset');
        expect(context).to.have.property('pre_a', 'pre_a');
        expect(context).to.have.property('pre_b', 'pre_b');
        return done();
      });
    });

    it('.parallel() - no functions', function (done) {
      return flw.parallel([], done);
    });
  });

  describe('.each', function () {
    it('.each()', function (done) {
      var items = ['a', 'b', 'c', 'd', 'e', 'f'];

      return flw.each(items, eachItemHandler, function (err, results) {
        expect(err).to.be(null);
        expect(results).to.contain('aa');
        expect(results).to.contain('ff');
        expect(results).have.length(items.length);
        return done();
      });
      
      function eachItemHandler(item, cb) {
        return cb(null, item+item);
      }
    });

    it('.each() - no items', function (done) {
      return flw.each([], eachHandler, done);

      function eachHandler(item, cb) {
        return cb();
      }
    });
  });

  describe('.wrap', function () {
    it('.wrap()', function (done) {
      var expectedResult = 'expectedResult';

      var obj = {
        value: 42,

        getValue : function getValue(expected, cb) {
          if (cb === undefined && typeof(expected) === 'function') {
            cb = expected;
            expected = undefined;
          }
          if (expected) return cb(null, expected);

          return cb(null, this.value);
        }
      };

      return flw.series([
        flw.wrap(obj.getValue.bind(obj)),
        flw.wrap(obj.getValue.bind(obj), 'default'),
        flw.wrap(obj.getValue.bind(obj), [expectedResult], 'expected')
      ], function onWrapHandlerDone(err, context) {
        expect(err).to.be(null);
        expect(context._clean()).to.eql({
          default: 42,
          expected: expectedResult
        });
        return done();
      });
    });
  });
});


describe('Combination flow', function () {
  it('combination flow', function (done) {
    return flw.series([
      flw.make.parallel([pre_a, pre_b]),
      flw.make.series([work_a, work_b]),
      flw.make.parallel([post_a, post_b])
    ], function onFlowDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).to.have.property('pre_b', 'pre_b');
      expect(context).to.have.property('work_a', 'work_a');
      expect(context).to.have.property('work_b', 'work_b');
      expect(context).to.have.property('post_a', 'post_a');
      expect(context).to.have.property('post_b', 'post_b');
      return done();
    });
  });
});


/**
 * Handlers used for testing
 */
function dummyHandler(context, cb) {
  return cb();
}

function test_stop(context, cb) {
  return context._stop('flw stopped ..', cb);
}

function test_stop_noReason(context, cb) {
  return context._stop(cb);
}

function pre_a(context, cb) {
  debug('in pre_a');
  context.pre_a = 'pre_a';
  // debug('pre_a', context);
  return cb();
}

function pre_b(context, cb) {
  debug('in pre_b');
  context.pre_b = 'pre_b';
  // debug('pre_b', context);
  return cb();
}

function work_a(context, cb) {
  expect(context.pre_a).to.be('pre_a');
  expect(context.pre_b).to.be('pre_b');
  expect(context.post_a).to.be(undefined);
  expect(context.post_b).to.be(undefined);
  context.work_a = 'work_a';
  // debug('work_a', context);
  return cb();
}

function work_b(context, cb) {
  expect(context.pre_a).to.be('pre_a');
  expect(context.pre_b).to.be('pre_b');
  expect(context.post_a).to.be(undefined);
  expect(context.post_b).to.be(undefined);
  context.work_b = 'work_b';
  // debug('work_b', context);
  return cb();
}

function post_a(context, cb) {
  expect(context.pre_a).to.be('pre_a');
  expect(context.pre_b).to.be('pre_b');
  expect(context.work_a).to.be('work_a');
  expect(context.work_b).to.be('work_b');
  context.post_a = 'post_a';
  // debug('post_a', context);
  return cb();
}

function post_b(context, cb) {
  expect(context.pre_a).to.be('pre_a');
  expect(context.pre_b).to.be('pre_b');
  expect(context.work_a).to.be('work_a');
  expect(context.work_b).to.be('work_b');
  context.post_b = 'post_b';
  // debug('post_b', context);
  return cb();
}
