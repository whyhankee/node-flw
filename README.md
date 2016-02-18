# flw

Another flow control library, inspired by `async` and `bach`.

[![Circle CI](https://circleci.com/gh/whyhankee/flw.svg?style=svg)](https://circleci.com/gh/whyhankee/flw)


## Disclaimer / Current state

  **It seems to work, would not use in production** - API's could still change.


### What / Why

`async` is the defacto standard for async flow control. I do have some issues here that I would like to improve:

* I'm always struggling with combinations of `auto`, `series`, `parallel`, `waterfall` and keeping references to the results from the called functions. It seems to boil down to either:

  * Make variables in an outer scope to assign them to
	* Dragging everything with you in a waterfall
	* Use `async.auto`, gives you a context object, but not really easy to read / maintain

* Better way to build complex flows, *very heavy* inspired by the elegant  <https://github.com/gulpjs/bach>
* Stop the endless `if (err) return cb(err);` madness if you just want to save the first value of an async operation


### How

The major change is that during the flow control a context object is passed to all called functions where they store their results or can retrieve results from other functions. No need to return anything other than errors.

An example handler looks like this:

  	function createUser(context, cb) {
      // add randomValue to the context;
      context.randomValue = 'notSoRandom';

      var user = new AppUser(userProps);
  		return user.save(context._flw_store('user', cb));
  	}

A flow could be called with:

    flw.series([
      flw.make.parallel([createUser, pre_b]),
      flw.make.series([work_a, work_b]),
      flw.make.parallel([post_a, post_b])
    ], function (err, context) {
      ....
    });


### Ideas

* Being able to stop the flow without abusing the `err` mechanism.


## Installation

    npm install flw

## API

### .series([fn, fn], done)

  example:

    flw.series([a, b, c], function onDone(err, results) {
      console.log(err, results;)
    });

### .parallel([fn, fn], done)

    example:

    flw.parallel([a, b, c], function onDone(err, results) {
      console.log(err, results;)
      });

### .make

With make you can use the flow functions without them directly executing. In this
way you can compose different flow functions without having to resort to anonymous
functions or having to `bind` them.

  example:

    var ourSeries = flw.make.series([a, b, c]);
    ourSeries(function onDone(err, results) {
      console.log(err, results;)
    });

  example:

    flw.series([
      flw.make.parallel([a, b]),
      flw.make.series([c, d, e]),
      flw.make.parallel([f, g, h, i])
    ], onDone);

## Tests and development

    DEBUG=flw* npm run tdd

Also, please don't forget to check this when you submit a PR

    npm run benchmark
