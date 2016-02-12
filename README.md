# flw

Another flow control library, inspired by Async and Bach.

## Why

Async is the defacto standard for async flow control. However, i'm always struggling with combinations of `series`, `parallel` and `waterfall` in combination with keeping a reference to the results from the called funtions.

So, the major change is that during the flow control a context object is passed to all called functions where they store their results or can retrieve results from other functions.


# Disclaimer

This is an experiment with async flow control while keeping a context object during the processes.

# Current state

  **do not use** - Just playing

# Installation

    npm install flw

# Tests and development

    DEBUG=flw* npm run tdd

# Example

    var flw = requrie('flw');

  simple series:

    function a(ctx, cb) { cta.a = 'a'; return cb() };
    function b(ctx, cb) { cta.b = 'b'; return cb() };

    flw.series([a, b], function(err, context)) {
      console.log(err, context);  // null, {a: 'a', b: 'b'}
    });

  or:

    var ourSeries = flw.series(a, b);
    ourSeries(function (err, ctx) {
      console.log(err, ctx);      // null, {a: 'a', b: 'b'}
    });

  more fun combinations (using fictional functions here)

    var preWork = flw.parallel(preWork1, preWork2);
    var work = flw.series(work1, work2);
    var postWork = flw.parallel(postWork1, postWork2);

    flw.series([preWork, work, postWork], function(err, context)) {
      console.log(err, context);
    });

  or:

    var allWork = flw.series(preWork, work, postWork);
    allWork(function (err, context) {
      console.log(err, context);
    });

# API

## .series([fn, fn], done)

    flw.series([a, b, c], function onDone(err, results) {
      console.log(err, results;)
    });

## .makeSeries(fn, fn, ...)

    var ourSeries = flw.makeSeries(a, b, c);
    ourSeries( function onDone(err, results) {
      console.log(err, results;)
    });

## .parallel([fn, fn], done)

    flw.parallel([a, b, c], function onDone(err, results) {
      console.log(err, results;)
    });

## .makeParallel(fn, fn, ...)

    var ourSeries = flw.makeParallel(a, b, c);
    ourSeries( function onDone(err, results) {
      console.log(err, results;)
    });
