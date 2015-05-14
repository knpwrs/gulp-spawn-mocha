const DEBUG = process.env.NODE_ENV === 'debug',
      CI = process.env.CI === 'true';

var gulp = require('gulp'),
    mocha = require('./lib'),
    through2 = require('through2');

gulp.task('test', function () {
  return gulp.src(['test/*.test.js'], {read: 1})
    .pipe(mocha({
      debugBrk: DEBUG,
      r: 'test/setup.js',
      R: CI ? 'spec' : 'nyan',
      istanbul: !DEBUG,
          outstream: 'outstream.html'
    }))
      .pipe(gulp.dest('report.html'));
});

gulp.task('default', ['test'], function () {
  gulp.watch('{lib,test}/*', ['test']);
});
