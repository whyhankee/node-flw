# flw

Another flow control library, inspired by `async` and `bach`.


### What / Why

`async` is the defacto standard for async flow control. I do have some issues here that I would like to improve:

* I'm always struggling with combinations of `auto`, `series`, `parallel`, `waterfall` and keeping references to the results from the called functions. It seems to boil down to either:
  	* Make variables in an outer scope to assign them too
	* Dragging everything with you in a waterfall
	* Use `async.auto`, gives you a context object, but not really easy to read / maintain

* Better way to build complex flows, *very heavy* inspired by the elegant  <https://github.com/gulpjs/bach>
* Optionally being able to stop the flow without abusing the `err` mechanism.
* optional beforeEach and afterEach handlers (for easy debug inspection).

### How

The major change is that during the flow control a context object is passed to all called functions where they store their results or can retrieve results from other functions. No need to return anything other than errors.

An example handler looks like this:

	function getSomething(context, cb) {
		context.something = {userId: 1};
		debug('getSomething, current context', context);
		return cb();
	}

A flow could be called with:

    fc.series([
      fc.makeParallel(pre_a, pre_b),
      fc.makeSeries(work_a, work_b),
      fc.makeParallel(post_a, post_b)
    ], onFlowDone);


## Disclaimer / Current state

  ** Only for playing around** - API's could still change.

  Note: for last-updates it's better to use the github repository directly.

### Todo list

* stop flow
* `beforeEach` and `afterEach` handlers


## Installation

    npm install flw

## API

### .series([fn, fn], done)

  example:

    flw.series([a, b, c], function onDone(err, results) {
      console.log(err, results;)
    });

### .makeSeries(fn, fn, ...)

example:

    var ourSeries = flw.makeSeries(a, b, c);
    ourSeries( function onDone(err, results) {
      console.log(err, results;)
    });

### .parallel([fn, fn], done)

example:

    flw.parallel([a, b, c], function onDone(err, results) {
      console.log(err, results;)
    });

### .makeParallel(fn, fn, ...)

example:

    var ourSeries = flw.makeParallel(a, b, c);
    ourSeries( function onDone(err, results) {
      console.log(err, results;)
    });


## Tests and development

    DEBUG=flw* npm run tdd
