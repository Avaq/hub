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

  describe("#getPromiseFor()", function(){

    it("should reject for unregisterred descriptors", function(done){
      var app = new App;
      var descriptor = {start: function(){}};
      expect(app.getPromiseFor(descriptor)).to.be.rejectedWith(
        "No plugin registered for given descriptor."
      ).notify(done);
    });

    it("should return a rejected promise for failed plugins", function(done){
      var app = new App;
      var descriptor = {start: function(){}};
      var plugin = app.register(descriptor);
      plugin.state = Plugin.FAILED;
      expect(app.getPromiseFor(descriptor)).to.be.rejected.notify(done);
    });

    it("should return a resolved promise for active plugins", function(done){
      var app = new App;
      var descriptor = {start: function(){}};
      var plugin = app.register(descriptor);
      plugin.state = Plugin.ACTIVE;
      expect(app.getPromiseFor(descriptor)).to.be.fulfilled.notify(done);
    });

    it("should reject when the plugin fails", function(done){
      var app = new App;
      var descriptor = {start: function(){throw new Error("Rejected")}};
      var plugin = app.register(descriptor);
      expect(app.getPromiseFor(descriptor)).to.be.rejected.notify(done);
      plugin.start().catch(function(err){/*swallow*/});
    });

    it("should resolve when the plugin activates", function(done){
      var app = new App;
      var descriptor = {start: function(){}};
      var plugin = app.register(descriptor);
      expect(app.getPromiseFor(descriptor)).to.be.fulfilled.notify(done);
      plugin.start();
    });

  });

  describe("#await()", function(){

    var opts = {pluginDirectory: path.resolve(__dirname, 'plugins')};

    it("should reject for unregisterred plugins", function(done){
      var app = new App(opts);
      expect(app.await('test')).to.be.rejectedWith(
        "A plugin is depending on test, which is not being used."
      ).notify(done);
    });

    it("should call getPromiseFor for every plugin", function(done){
      var app = new App(opts);
      var plugin = app.use('test');
      app.getPromiseFor = sinon.stub().returns(Promise.resolve());
      app.await('test').then(function(){
        expect(app.getPromiseFor).to.have.been.calledWith(plugin.descriptor);
      })
      .nodeify(done);
    });

  });

  describe("#start()", function(){

    it("should return a promise", function(){
      var app = new App;
      expect(app.start()).to.be.an.instanceof(Promise);
    });

    it("should call every Plugin#start method", function(done){
      var app = new App;
      var spies = [sinon.spy(), sinon.spy()];
      app.register({start: spies[0]});
      app.register({start: spies[1]});
      app.start(Infinity).then(function(){
        expect(spies[0]).to.have.been.called;
        expect(spies[1]).to.have.been.called;
      })
      .nodeify(done);
    });

    it("should reject if the timeout is reached", function(done){
      var app = new App;
      app.register({start: function(){return Promise.delay(1000)}});
      expect(app.start(20)).to.be.rejectedWith(/timed out/).notify(done);
    });

    it("should keep track of started plugins", function(done){
      var app = new App;
      var plugin = app.register({start: function(){}});
      app.start(null).then(function(){
        expect(app._started).to.be.an('array');
        expect(app._started).to.include(plugin);
      })
      .nodeify(done);
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
