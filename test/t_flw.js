/* eslint-env mocha */
'use strict';
var async = require('neo-async');
var expect = require('expect.js');
var debug = require('debug')('flw:test');

var fc = require('../flw');


describe('Basic operations', function () {
  it('.series()', function (done) {
    fc.series([pre_a, pre_b], function onSeriesDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).to.have.property('pre_b', 'pre_b');
      return done();
    });
  });

  it('.make.series()', function (done) {
    var fn = fc.make.series([pre_a, pre_b]);
    fn(function onMakeSeriesDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).to.have.property('pre_b', 'pre_b');
      return done();
    });
  });

  it('.series() with _stop', function (done) {
    fc.series([pre_a, test_stop, pre_b], function onSeriesDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).not.to.have.property('pre_b');
      return done();
    });
  });

  it('.parallel()', function (done) {
    fc.parallel([pre_a, pre_b], function onParallelDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).to.have.property('pre_b', 'pre_b');
      return done();
    });
  });

  it('.make.parallel()', function (done) {
    var fn = fc.make.parallel([pre_a, pre_b]);
    fn(function onMakeParallelDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).to.have.property('pre_b', 'pre_b');
      return done();
    });
  });

  it('.each()', function (done) {
    var items = ['a', 'b', 'c', 'd', 'e', 'f'];

    return fc.each(items, eachItemHandler, function (err, results) {
      expect(err).to.be(null);
      expect(results).to.contain('a');
      expect(results).to.contain('f');
      expect(results).have.length(items.length);
      return done();
    });
    function eachItemHandler(item, cb) {
      return cb(null, item);
    }
  });

  it('.series() with injected context', function (done) {
    var preSet = {preset: 'preset'};

    fc.series([pre_a, pre_b], preSet, function onSeriesDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.have.property('preset', 'preset');
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).to.have.property('pre_b', 'pre_b');
      return done();
    });
  });
});


describe('Context handling', function () {
  it('correct context keys', function (done) {
    fc.series([dummyHandler], function (err, context) {
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
    fc.series([testHandler], function (err, context) {
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

  it('_clean()', function (done) {
    fc.series([pre_a], function (err, context) {
      expect(err).to.be(null);
      expect(context._clean()).to.only.have.key('pre_a');
      return done();
    });
  });
});


describe('Complex flows', function () {
  it('combination flow', function (done) {
    fc.series([
      fc.make.parallel([pre_a, pre_b]),
      fc.make.series([work_a, work_b]),
      fc.make.parallel([post_a, post_b])
    ], onFlowDone);
    function onFlowDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).to.have.property('pre_b', 'pre_b');
      expect(context).to.have.property('work_a', 'work_a');
      expect(context).to.have.property('work_b', 'work_b');
      expect(context).to.have.property('post_a', 'post_a');
      expect(context).to.have.property('post_b', 'post_b');
      return done();
    }
  });
});


describe('Context separation', function () {
  it('separates contexts between independent runs (this safe)', function (done) {
    var batchHandlers = [pre_a, pre_b];
    var batch = {};

    batchHandlers.forEach(function (bh) {
      var handlers = [];
      for (var n=0; n<50; n++) {
        handlers.push(deferHandler(bh));
      }
      debug('calling fc.make.parallel on '+bh.name);
      batch[bh.name] = fc.make.parallel(handlers);
    });

    // test with async
    //  if we would run with flow it would combine the contexts
    debug('starting async');
    return async.parallel(batch, function (err, results) {
      expect(err).to.be(null);
      expect(results).to.only.have.keys(['pre_a', 'pre_b']);
      expect(results.pre_a._clean()).to.only.have.keys(['pre_a']);
      expect(results.pre_b._clean()).to.only.have.keys(['pre_b']);
      return done(err);
    });
  });
});


/**
 * Specialised handlers that will check the state of the context
 */

function dummyHandler(context, cb) {
  return cb();
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

function test_stop(context, cb) {
  context._stop('flw stopped ..', cb);
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


/**
 * Returns a deferred handler call (to enforce randomness)
 *
 * @private
 */

function deferHandler(handler) {
  var df = function deferredHandler(context, callback) {
    var timeoutMs = Math.round(Math.random() * 20);
    debug('calling deferredHandler '+handler.name, {timeout: timeoutMs});
    setTimeout(handler, timeoutMs, context, callback);
  };
  return df;
}
