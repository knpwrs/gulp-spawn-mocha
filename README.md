# gulp-spawn-mocha

[![Build Status](https://travis-ci.org/KenPowers/gulp-spawn-mocha.png?branch=master)](https://travis-ci.org/KenPowers/gulp-spawn-mocha)

This is a plugin for [gulp][gulp] which runs [Mocha][mocha] tests in a
separate process from the `gulp` process. Each time tests are run a new child
process is created meaning the test environment always starts cleanly (i.e.,
globals are reset as are non- enumerable properties defined on native
prototypes via `Object.defineProperty`. This also means that if your tests
crash the node process (e.g., `process.exit(-1)`.) then an `error` event is
emitted rather than your whole `gulp` process crashing (good for watching). It
is simple enough to make gulp crash when necessary (e.g., for continuous
integration) by throwing the error as outlined below.

## Usage

Usage is according to this API:

```javascript
stream.pipe(mocha({
  // options
}))
```

The only special option is `bin`. You can set `bin` to be a path to a `mocha`
executable to use instead of the one bundled with this plugin. Currently, this
plugin comes with mocha `~1`, meaning that on each `npm install` the latest
`1.x` version of `mocha` will be installed. All other options are properly
prefixed with either `-` or `--` and passed to the `mocha` executable. Any
arguments which do not take a value (e.g., `c`, `--colors`, or `debug`) should
just have a value of `true`. See the following example usage:

```javascript
var gulp = require('gulp'),
    mocha = require('gulp-spawn-mocha');

gulp.task('test', function () {
  return test().on('error', function (e) {
    throw e;
  });
});

gulp.task('default', function () {
  gulp.watch('{lib,test}/*', test);
  test();
});

function test() {
  return gulp.src(['test/*.test.js'], {read: false}).pipe(mocha({
    r: 'test/setup.js',
    R: 'spec',
    c: true,
    debug: true
  })).on('error', console.warn.bind(console));
}
```

The `test` *function* will run the `mocha` executable telling it to require
`test/setup.js` and use the `spec` reporter -- if there is an error it will
output a warning to the console. See `mocha -h` for additional options.

The `test` *task* will throw an error, crashing `gulp` (good for continuous
integration environments).

The `default` task will watch for changes and execute tests whenever a change
is detected. It will also execute tasks immediately without waiting for a
change.

## This or `gulp-mocha`?

The original `gulp-mocha` is fine in most circumstances. If you need your
tests to run as a separate process (or a separate process is simply your
preference for the reasons specified above) or you need to use a custom
version of Mocha (e.g., a fork with bug fixes or custom functionality) then
you should use this plugin.

## License

**The MIT License**

Copyright (c) 2014 Kenneth Powers

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

  [gulp]: http://gulpjs.com/ "gulp.js"
  [mocha]: http://visionmedia.github.io/mocha/ "Mocha"
