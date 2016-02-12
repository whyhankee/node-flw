// jshint mocha: true
'use strict';
var expect = require('expect.js');
var debug = require('debug')('flw:test');

var fc = require('../flw');


describe('basic operations', function () {

  it('.series', function (done) {
    fc.series([pre_a, pre_b], function onSeriesDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.eql({pre_a: 'pre_a', pre_b: 'pre_b'});
      return done();
    });
  });

  it('.makeSeries', function (done) {
    var fn = fc.makeSeries(pre_a, pre_b);
    fn(function onMakeSeriesDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.eql({pre_a: 'pre_a', pre_b: 'pre_b'});
      return done();
    });
  });

  it('.parallel', function (done) {
    fc.parallel([pre_a, pre_b], function onParallelDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.eql({pre_a: 'pre_a', pre_b: 'pre_b'});
      return done();
    });
  });

  it('.makeParallel', function (done) {
    var fn = fc.makeParallel(pre_a, pre_b);
    fn(function onMakeParallelDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.eql({pre_a: 'pre_a', pre_b: 'pre_b'});
      return done();
    });
  });

  it('All together now', function (done) {
    var pre = fc.makeParallel(pre_a, pre_b);
    var work = fc.makeSeries(work_a, work_b);
    var post = fc.makeParallel(post_a, post_b);
    var allWork = fc.makeSeries(pre, work, post);
    allWork(function onAllWorkDone(err, context) {
      expect(err).to.be(null);
      expect(context).to.eql({
        pre_a: 'pre_a', pre_b: 'pre_b',
        work_a: 'work_a', work_b: 'work_b',
        post_a: 'post_a', post_b: 'post_b'
      });
      return done();
    });
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
