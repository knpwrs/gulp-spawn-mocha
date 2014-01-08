var gulp = require('gulp'),
    mocha = require('./lib');

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
    R: 'nyan'
  })).on('error', console.warn.bind(console));
}
