var App = require('../src/app');
var Plugin = require('../src/plugin');
var path = require('path');

//Test util first
require('./util');

describe("App", function(){

  it("should construct with no arguments", function(){
    var app = new App;
    expect(app).to.be.an.instanceof(App);
  });

  it("should construct with empty options", function(){
    var app = new App({});
    expect(app).to.be.an.instanceof(App);
  });

  it("should merge given options with defaults", function(){
    var app = new App({pluginDirectory: './plugins'});
    expect(app._options.pluginDirectory).to.equal('./plugins');
  });

  //Test plugin class next.
  require('./plugin');

  describe("#resolvePluginPath()", function(){

    var app = new App({pluginDirectory: '/foo'});

    it("should resolve plugin names to paths", function(){
      expect(app.resolvePluginPath('bar')).to.equal('/foo/bar');
      expect(app.resolvePluginPath('../bar')).to.equal('/bar');
    });

  });

  describe("#register()", function(){

    var app = new App;
    var descriptor = {start: sinon.spy()};
    var plugin;

    it("should throw when given an invalid plugin", function(){
      expect(function(){app.register("")}).to.throw(TypeError);
      expect(function(){app.register([])}).to.throw(TypeError);
      expect(function(){app.register(true)}).to.throw(TypeError);
      expect(function(){app.register(undefined)}).to.throw(TypeError);
      expect(function(){app.register(1)}).to.throw(TypeError);
      expect(function(){app.register(NaN)}).to.throw(TypeError);
    });

    it("should create a new Plugin", function(){
      plugin = app.register(descriptor);
      expect(plugin).to.be.an.instanceof(Plugin);
    });

    it("should not create a new plugin for an already registered descriptor", function(){
      expect(app.register(descriptor)).to.equal(plugin);
    });

  });

  describe("#use()", function(){

    var app = new App({pluginDirectory: path.resolve(__dirname, 'plugins')});

    before("stubbing register", function(){
      sinon.stub(app, 'register');
    });

    after("restoring register", function(){
      app.register.restore();
    });

    it("should call register with the resolved name", function(){
      app.use("test");
      expect(app.register).to.have.been.calledWith(require('./plugins/test'));
    });

  });

  // it.skip("What?", function(){

  //   app.use('b').then(function(){console.log('B loaded')});
  //   app.use('c').then(function(){console.log('C loaded')});
  //   app.use('a').then(function(){console.log('A loaded')});

  //   app.init()

  //   .then(function(){
  //     console.log('All loaded');
  //     console.log(app);
  //   })

  //   .catch(function(err){
  //     console.error("App failed to load.");
  //     console.error(err.stack);
  //     process.exit(1);
  //   });

  // });

});
