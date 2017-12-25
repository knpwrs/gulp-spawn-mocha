'use strict'

/* eslint-env node, mocha */
/* global sinon */

const mocha = require('../lib')
const through = require('through')
const proc = require('child_process')
const join = require('path').join
const PluginError = require('gulp-util').PluginError
const fs = require('fs')

describe('gulp-spawn-mocha tests', () => {
  beforeEach(function () {
    sinon.stub(proc, 'fork')
    this.childOn = sinon.stub()
    this.childOut = sinon.stub(through())
    this.childErr = sinon.stub(through())
    proc.fork.returns({
      stdout: this.childOut,
      stderr: this.childErr,
      on: this.childOn
    })
  })

  afterEach(() => {
    // Restore fork functionality
    proc.fork.restore()
  })

  describe('main', () => {
    it('should buffer filenames and pass them to mocha', function () {
      let stream = (this.stream = mocha())
      let paths = ['foo', 'bar', 'baz']
      paths.forEach((path) => {
        stream.write({ path })
      })
      stream._files.should.deep.equal(paths)
      proc.fork.should.not.be.called
      stream.end()
      proc.fork.should.be.calledWith(sinon.match.string, this.stream._files)
    })

    it('should default to proper binary', function () {
      let bin = join(require.resolve('mocha'), '..', 'bin', 'mocha')
      let stream = (this.stream = mocha())
      stream.write({ path: 'foo' })
      stream.end()
      proc.fork.should.be.calledWith(
        bin,
        ['foo'],
        sinon.match({ execPath: process.execPath })
      )
    })

    it('should allow for a custom mocha binary', function () {
      let stream = (this.stream = mocha({ bin: 'foo mocha' }))
      stream.write({ path: 'foo' })
      stream.end()
      proc.fork.should.be.calledWith('foo mocha', ['foo'])
    })

    it('should allow for a custom environment', function () {
      let stream = (this.stream = mocha({ env: { FOO: 'BAR' } }))
      stream.write({ path: 'foo' })
      stream.end()
      proc.fork.should.be.calledWith(
        sinon.match.any,
        sinon.match.any,
        sinon.match({ env: { FOO: 'BAR' } })
      )
    })

    it('should allow for a custom working directory', function () {
      let stream = (this.stream = mocha({ cwd: './tmp' }))
      stream.write({ path: 'foo' })
      stream.end()
      proc.fork.should.be.calledWith(
        sinon.match.any,
        sinon.match.any,
        sinon.match({ cwd: './tmp' })
      )
    })

    it('should allow for a custom execPath', function () {
      let stream = (this.stream = mocha({ execPath: '/foo/bar' }))
      stream.write({ path: 'foo' })
      stream.end()
      proc.fork.should.be.calledWith(
        sinon.match.any,
        sinon.match.any,
        sinon.match({ execPath: '/foo/bar' })
      )
    })

    it('should pass arguments to mocha, properly prefixing, dashifying, and ignoring', function () {
      let stream = (this.stream = mocha({
        foo: 'bar',
        b: ['oof', 'rab'],
        debugBrk: true,
        isAString: true,
        R: 'spec',
        S: true,
        T: false,
        U: null,
        V: undefined,
        maxOldSpaceSize: 4096
      }))
      stream.write({ path: 'foo' })
      stream.end()
      proc.fork.should.be.calledWith(sinon.match.string, [
        '--foo',
        'bar',
        '-b',
        'oof',
        '-b',
        'rab',
        '--debug-brk',
        '--is-a-string',
        '-R',
        'spec',
        '-S',
        '--max-old-space-size=4096',
        'foo'
      ])
    })

    it('should handle non-errors from mocha', function () {
      this.childOn.withArgs('close').yields(0)
      let stream = (this.stream = mocha())
      sinon.spy(stream, 'emit')
      stream.write({ path: 'foo' })
      stream.end()
      this.childOn.should.be.calledTwice
      stream.emit.should.be.calledWith('end')
    })

    it('should handle errors from mocha', function () {
      this.childOn.yields(-1)
      let stream = (this.stream = mocha())
      sinon.stub(stream, 'emit')
      stream.emit.withArgs('error').returns()
      stream.write({ path: 'foo' })
      stream.end()
      this.childOn.should.be.calledTwice
      stream.emit.should.be.calledWith(
        'error',
        sinon.match.instanceOf(PluginError)
      )
    })

    it('can output to a writable stream from a string argument', function () {
      let fakeStream = {}
      sinon.stub(fs, 'createWriteStream').returns(fakeStream)
      let stream = (this.stream = mocha({ output: 'result.log' }))
      stream.write({ path: 'foo' })
      stream.end()
      fs.createWriteStream.should.be.calledWith('result.log')
      fs.createWriteStream.restore()
      this.childOut.pipe.should.be.calledWith(fakeStream)
      this.childErr.pipe.should.be.calledWith(fakeStream)
    })

    it('can output to a writable stream', function () {
      let fakeStream = {}
      let stream = (this.stream = mocha({ output: fakeStream }))
      stream.write({ path: 'foo' })
      stream.end()
      this.childOut.pipe.should.be.calledWith(fakeStream)
      this.childErr.pipe.should.be.calledWith(fakeStream)
    })

    it('dont fork if no file to test', function () {
      let stream = (this.stream = mocha())
      stream.end()
      proc.fork.should.have.not.been.called
    })
  })

  describe('istanbul functionality', () => {
    let bin = join(
      require.resolve('istanbul'),
      '..',
      require('istanbul/package.json').bin.istanbul
    )
    let mbin = join(require.resolve('mocha'), '..', 'bin', '_mocha')

    it('should properly call istanbul with no arguments', function () {
      let stream = (this.stream = mocha({ istanbul: true }))
      stream.write({ path: 'foo' })
      stream.end()
      proc.fork.should.be.calledWith(bin, ['cover', '--', mbin, 'foo'])
    })

    it('should properly call istanbul with one more more arguments', function () {
      let stream = (this.stream = mocha({
        istanbul: { verbose: true, print: 'detail' }
      }))
      stream.write({ path: 'foo' })
      stream.end()
      proc.fork.should.be.calledWith(bin, [
        'cover',
        '--verbose',
        '--print',
        'detail',
        '--',
        mbin,
        'foo'
      ])
    })

    it('can use a custom binary', function () {
      let stream = (this.stream = mocha({ istanbul: { bin: 'isparta' } }))
      stream.write({ path: 'foo' })
      stream.end()
      proc.fork.should.be.calledWith('isparta', ['cover', '--', mbin, 'foo'])
    })
  })
})
