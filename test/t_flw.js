// jshint mocha: true
'use strict';
var expect = require('expect.js');
var debug = require('debug')('flw:test');

var fc = require('../flw');


describe('basic operations', function () {

  it('.series', function (done) {
    fc.series([pre_a, pre_b], function onSeriesDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).to.have.property('pre_b', 'pre_b');
      return done();
    });
  });

  it('.make.series', function (done) {
    var fn = fc.make.series([pre_a, pre_b]);
    fn(function onMakeSeriesDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).to.have.property('pre_b', 'pre_b');
      return done();
    });
  });

  it('.parallel', function (done) {
    fc.parallel([pre_a, pre_b], function onParallelDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).to.have.property('pre_b', 'pre_b');
      return done();
    });
  });

  it('.make.parallel', function (done) {
    var fn = fc.make.parallel([pre_a, pre_b]);
    fn(function onMakeParallelDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.have.property('pre_a', 'pre_a');
      expect(context).to.have.property('pre_b', 'pre_b');
      return done();
    });
  });

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

  it('stores result from cb', function (done) {
    var userData = {id: 12345, 'name': 'username'};

    fc.series([storeUser], function (err, c) {
      expect(err).to.be(null);
      expect(c.user).to.eql(userData);
      return done();
    });

    function storeUser(context, cb) {
      // simulate a user.save() like method,
      //  passing c.store() as the cb (with the actual cb)
      saveSomething(context._flw_store('user', cb));
    }
    function saveSomething(cb) {
      setImmediate(function (_cb, userData) {
        return _cb(null, userData);
      }, cb, userData);
    }
  });
});



function pre_a(context, cb) {
  context.pre_a = 'pre_a';
  debug('pre_a', context);
  return cb();
}

function pre_b(context, cb) {
  context.pre_b = 'pre_b';
  debug('pre_b', context);
  return cb();
}

function work_a(context, cb) {
  expect(context.pre_a).to.be('pre_a');
  expect(context.pre_b).to.be('pre_b');
  expect(context.post_a).to.be(undefined);
  expect(context.post_b).to.be(undefined);
  context.work_a = 'work_a';
  debug('work_a', context);
  return cb();
}

function work_b(context, cb) {
  expect(context.pre_a).to.be('pre_a');
  expect(context.pre_b).to.be('pre_b');
  expect(context.post_a).to.be(undefined);
  expect(context.post_b).to.be(undefined);
  context.work_b = 'work_b';
  debug('work_b', context);
  return cb();
}

function post_a(context, cb) {
  expect(context.pre_a).to.be('pre_a');
  expect(context.pre_b).to.be('pre_b');
  expect(context.work_a).to.be('work_a');
  expect(context.work_b).to.be('work_b');
  context.post_a = 'post_a';
  debug('post_a', context);
  return cb();
}

function post_b(context, cb) {
  expect(context.pre_a).to.be('pre_a');
  expect(context.pre_b).to.be('pre_b');
  expect(context.work_a).to.be('work_a');
  expect(context.work_b).to.be('work_b');
  context.post_b = 'post_b';
  debug('post_b', context);
  return cb();
}
