# flw

Another flow control library, inspired by Async and Bach.

## Why

Async is the defacto standard for async flow control. However, i'm always struggling with combinations of `.auto`, `.series`, `.parallel`, `.waterfall` and keeping references to the results from the called functions.

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

    function a(ctx, cb) { ctx.a = 'a'; return cb() };
    function b(ctx, cb) { ctx.b = 'b'; return cb() };

    flw.series([a, b], function(err, context)) {
      console.log(err, context);  // null, {a: 'a', b: 'b'}
    });

  or:

    var ourSeries = flw.makeSeries(a, b);
    ourSeries(function (err, ctx) {
      console.log(err, ctx);      // null, {a: 'a', b: 'b'}
    });

  more fun combinations (using fictional functions here)

    var preWork = flw.makeParallel(preWork1, preWork2);
    var work = flw.makeSeries(work1, work2);
    var postWork = flw.makeParallel(postWork1, postWork2);

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

  example:

    flw.series([a, b, c], function onDone(err, results) {
      console.log(err, results;)
    });

## .makeSeries(fn, fn, ...)

example:

    var ourSeries = flw.makeSeries(a, b, c);
    ourSeries( function onDone(err, results) {
      console.log(err, results;)
    });

## .parallel([fn, fn], done)

example:

    flw.parallel([a, b, c], function onDone(err, results) {
      console.log(err, results;)
    });

## .makeParallel(fn, fn, ...)

example:

    var ourSeries = flw.makeParallel(a, b, c);
    ourSeries( function onDone(err, results) {
      console.log(err, results;)
    });
