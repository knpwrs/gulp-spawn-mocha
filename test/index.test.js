describe('gulp-spawn-mocha tests', function () {
  var mocha = require('../lib'),
      through = require('through'),
      proc = require('child_process'),
      join = require('path').join,
      PluginError = require('gulp-util').PluginError,
      fs = require('fs');

  beforeEach(function () {
    sinon.stub(proc, 'fork');
    this.childOn = sinon.stub();
    this.childOut = sinon.stub(through());
    this.childErr = sinon.stub(through());
    proc.fork.returns({
      stdout: this.childOut,
      stderr: this.childErr,
      on: this.childOn
    });
  });

  afterEach(function () {
    // Restore fork functionality
    proc.fork.restore();
  });

  describe('main', function () {
    it('should buffer filenames and pass them to mocha', function () {
      var stream = this.stream = mocha();
      var paths = ['foo', 'bar', 'baz'];
      paths.forEach(function (path) {
        stream.write({path: path});
      });
      stream._files.should.deep.equal(paths);
      proc.fork.should.not.be.called;
      stream.end();
      proc.fork.should.be.calledWith(sinon.match.string, this.stream._files);
    });

    it('should default to proper binary', function () {
      var bin = join(require.resolve('mocha'), '..', 'bin', 'mocha');
      var stream = this.stream = mocha();
      stream.write({path: 'foo'});
      stream.end();
      proc.fork.should.be.calledWith(bin, ['foo'], sinon.match({execPath: process.execPath}));
    });

    it('should allow for a custom mocha binary', function () {
      var stream = this.stream = mocha({bin: 'foo mocha'});
      stream.write({path: 'foo'});
      stream.end();
      proc.fork.should.be.calledWith('foo mocha', ['foo']);
    });

    it('should allow for a custom environment', function () {
      var stream = this.stream = mocha({env: {'FOO' : 'BAR'}});
      stream.write({path: 'foo'});
      stream.end();
      proc.fork.should.be.calledWith(sinon.match.any, sinon.match.any, sinon.match({env: {'FOO' : 'BAR'}}));
    });

    it('should allow for a custom working directory', function () {
      var stream = this.stream = mocha({cwd: './tmp'});
      stream.write({path: 'foo'});
      stream.end();
      proc.fork.should.be.calledWith(sinon.match.any, sinon.match.any, sinon.match({cwd: './tmp'}));
    });

    it('should allow for a custom execPath', function () {
      var stream = this.stream = mocha({execPath: '/foo/bar'});
      stream.write({path: 'foo'});
      stream.end();
      proc.fork.should.be.calledWith(sinon.match.any, sinon.match.any, sinon.match({execPath: '/foo/bar'}));
    });

    it('should pass arguments to mocha, properly prefixing, dashifying, and ignoring', function () {
      var stream = this.stream = mocha({foo: 'bar', b: ['oof', 'rab'], debugBrk: true, isAString: true, R: 'spec', S: true, T: false, U: null, V: undefined, maxOldSpaceSize: 4096});
      stream.write({path: 'foo'});
      stream.end();
      proc.fork.should.be.calledWith(sinon.match.string, ['--foo', 'bar', '-b', 'oof', '-b', 'rab', '--debug-brk', '--is-a-string', '-R', 'spec', '-S', '--max-old-space-size=4096', 'foo']);
    });

    it('should handle non-errors from mocha', function () {
      this.childOn.withArgs('close').yields(0);
      var stream = this.stream = mocha();
      sinon.spy(stream, 'emit');
      stream.write({path: 'foo'});
      stream.end();
      this.childOn.should.be.calledTwice;
      stream.emit.should.be.calledWith('end');
    });

    it('should handle errors from mocha', function () {
      this.childOn.yields(-1);
      var stream = this.stream = mocha();
      sinon.stub(stream, 'emit');
      stream.emit.withArgs('error').returns();
      stream.write({path: 'foo'});
      stream.end();
      this.childOn.should.be.calledTwice;
      stream.emit.should.be.calledWith('error', sinon.match.instanceOf(PluginError));
    });

    it('can output to a writable stream from a string argument', function () {
      var fakeStream = {};
      sinon.stub(fs, 'createWriteStream').returns(fakeStream);
      var stream = this.stream = mocha({output: 'result.log'});
      stream.write({path: 'foo'});
      stream.end();
      fs.createWriteStream.should.be.calledWith('result.log');
      fs.createWriteStream.restore();
      this.childOut.pipe.should.be.calledWith(fakeStream);
      this.childErr.pipe.should.be.calledWith(fakeStream);
    });

    it('can output to a writable stream', function () {
      var fakeStream = {};
      var stream = this.stream = mocha({output: fakeStream});
      stream.write({path: 'foo'});
      stream.end();
      this.childOut.pipe.should.be.calledWith(fakeStream);
      this.childErr.pipe.should.be.calledWith(fakeStream);
    });

    it('dont fork if no file to test', function () {
      var stream = this.stream = mocha();
      stream.end();
      proc.fork.should.have.not.been.called;
    });

  });

  describe('istanbul functionality', function () {
    var bin = join(require.resolve('istanbul'), '..', require('istanbul/package.json').bin.istanbul);
    var mbin = join(require.resolve('mocha'), '..', 'bin', '_mocha');

    it('should properly call istanbul with no arguments', function () {
      var stream = this.stream = mocha({istanbul: true});
      stream.write({path: 'foo'});
      stream.end();
      proc.fork.should.be.calledWith(bin, ['cover', '--', mbin, 'foo']);
    });

    it('should properly call istanbul with one more more arguments', function () {
      var stream = this.stream = mocha({istanbul: {verbose: true, print: 'detail'}});
      stream.write({path: 'foo'});
      stream.end();
      proc.fork.should.be.calledWith(bin, ['cover', '--verbose', '--print', 'detail', '--', mbin, 'foo']);
    });

    it('can use a custom binary', function () {
      var stream = this.stream = mocha({istanbul: {bin: 'isparta'}});
      stream.write({path: 'foo'});
      stream.end();
      proc.fork.should.be.calledWith('isparta', ['cover', '--', mbin, 'foo']);
    });
  });
});
