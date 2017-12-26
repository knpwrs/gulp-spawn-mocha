'use strict'

const DEBUG = process.env.NODE_ENV === 'debug'
const CI = process.env.CI === 'true'

const gulp = require('gulp')
const mocha = require('./lib')

gulp.task('test', () =>
  gulp.src(['test/*.test.js'], { read: false }).pipe(
    mocha({
      debugBrk: DEBUG,
      r: 'test/setup.js',
      R: CI ? 'spec' : 'nyan',
      nyc: {
        instrument: true,
        sourceMap: true,
        reporter: ['lcov', 'text-summary'],
        cache: true,
        reportDir: 'coverage'
      }
    })
  )
)

gulp.task('default', ['test'], () => {
  gulp.watch('{lib,test}/*', ['test'])
})
