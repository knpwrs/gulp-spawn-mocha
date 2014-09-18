describe('gulp-spawn-mocha tests', function () {
  var mocha = require('../lib'),
      through = require('through'),
      proc = require('child_process'),
      PluginError = require('gulp-util').PluginError;

  beforeEach(function () {
    sinon.stub(proc, 'fork');
    this.childOn = sinon.stub();
    proc.fork.returns({
      stdout: sinon.stub(through()),
      stderr: sinon.stub(through()),
      on: this.childOn
    });
  });

  afterEach(function () {
    // Common assertions
    proc.fork.should.be.calledOnce;
    proc.fork.should.be.calledWith(sinon.match.string, sinon.match.array);
    // Restore fork functionality
    proc.fork.restore();
  });

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
    var bin = require('path').join(require.resolve('mocha'), '..', 'bin', 'mocha');
    var stream = this.stream = mocha();
    stream.end();
    proc.fork.should.be.calledWith(bin, []);
  });

  it('should allow for a custom mocha binary', function () {
    var stream = this.stream = mocha({bin: 'foo mocha'});
    stream.end();
    proc.fork.should.be.calledWith('foo mocha', []);
  });

  it('should allow for a custom environment', function () {
    var stream = this.stream = mocha({env: {'FOO' : 'BAR'}});
    stream.end();
    proc.fork.should.be.calledWith(sinon.match.any, sinon.match.any, sinon.match({env: {'FOO' : 'BAR'}}));
  });

  it('should pass arguments to mocha', function () {
    var stream = this.stream = mocha({foo: 'bar', b: ['oof', 'rab'], debugBrk: true, isAString: true, R: 'spec', S: true});
    stream.end();
    proc.fork.should.be.calledWith(sinon.match.string, ['--foo', 'bar', '-b', 'oof', '-b', 'rab', '--debug-brk', '--is-a-string', '-R', 'spec', '-S']);
  });

  it('should only pass string or number values of arguments to mocha', function() {
    var stream = this.stream = mocha({foo: 'bar', n: 42, colors: true, debug: undefined, S: null});
    stream.end();
    proc.fork.should.be.calledWith(sinon.match.string, ['--foo', 'bar', '-n', 42, '--colors', '--debug', '-S']);
  });

  it('should handle errors from mocha', function () {
    this.childOn.yields(-1);
    var stream = this.stream = mocha();
    sinon.stub(stream, 'emit');
    stream.emit.withArgs('error').returns();
    stream.end();
    this.childOn.should.be.calledTwice;
    stream.emit.should.be.calledWith('error', sinon.match.instanceOf(PluginError));
  });
});
