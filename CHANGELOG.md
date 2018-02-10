## flw changelog

#### v0.1.2

* .series & .parallel: Change returnKey argument (before cb)
* Update dependencies

#### v0.1.1

* .series & .parallel: Support returnKey argument
* Update dependencies

#### v0.1.0

* Changed github project name to `node-flw`
* Implement `flw.n()`
* Implement `flw.eachSeries()`
* Make context functions non-enumerable
* Drop Node 0.10 support

#### v0.0.18

* Don’t throw on 2nd error in a .parallel (oops)
* Update dependencies

#### v0.0.17

* Implement flw.times()
* Update dependencies
* Reduce Travis-CI build environments to 0.10 + LTS versions

#### v0.0.16

* Fix handling of empty arrays to .series() & .parallel()
* Lets hope this one actually gets published to NPM

#### v0.0.15

* Allow context._stop(cb)  (without reason)
* Updated dependencies
* Updates to the README

#### v0.0.14

* Fix ESlint dependency for older node version

#### v0.0.13

* Updated dependencies
* Implement .wrap()
* Update README documentation
* Fix: context._clean() now returns a copy of the object

#### v0.0.12

* Fix ESlint dependency for older node version

#### v0.0.11

* .series() support for `context._stop(reason, cb);`
* Update dependencies

#### v0.0.10

* Implement context.\_clean()
* Switched from CircleCI to TravisCI
* Update documentation for `.each()`

#### v0.0.9

* `.each()` now returns the results

#### v0.0.8

* Browser bugfix

#### v0.0.7

* new method `.each()`
* Support predefined (optional) context

```
var context = {
    preset: 'something'
};
flw.series(fns, context, callback);
```

#### v0.0.6

* Also pass context to final callback in an error situation

#### v0.0.5

* Complete browser support (see tests/browser.html)
* Added tests for context separation

#### v0.0.4

* Browser support (setTimeout, slow!!)

#### v0.0.3

* Changed syntax of makeParallel() & makeSerial() to make.serial() & make.parallel()
  Thanks @godspeedelbow
* Changed function signature of make.* (always use arrays)
* added context.flw_store() method
* Added to CircleCI and show badge
* Added benchmarks

#### v0.0.2

* Cleanup

#### v0.0.1

* Initial commit
