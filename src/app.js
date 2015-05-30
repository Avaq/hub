"use strict";
var Promise = require('bluebird');
var path = require('path');
var Plugin = require('./plugin')

//Default options.
var defaults = {
  pluginDirectory: path.resolve(process.cwd(), 'plugins')
};

/**
 * Your typical plugin-container / service-locator.
 *
 * This object will contain all of your services.
 *
 * @type {App}
 */
class App {

  /**
   * Constructs an App.
   *
   * @param {Object} options A hash of options.
   * @param {String} options.pluginDirectory The base directory to look for for plugins.
   *                                         Defaults to `<cwd>/plugins`.
   *                                         {@see App.prototype.resolvePluginPath}
   */
  constructor(options){
    this._options = options || defaults;
    this._plugins = new Map;
    this._started = [];
    options && Object.keys(defaults).forEach(function(key){
      options[key] = options[key] || defaults[key];
    });
  };

  /**
   * Register a plugin by path.
   *
   * A convenience method over {@see App.prototype.register} which resolves the
   * path to the plugin using {@see App.prototype.resolvePluginPath} with the
   * given name, requires the file and uses the exports as the plugin descriptor.
   *
   * @param {String} name The name of, and relative path to, the plugin.
   *
   * @return {Plugin} The Plugin instance created by {@see App.prototype.register}.
   */
  use(name){
    return this.register(require(this.resolvePluginPath(name)));
  };

  /**
   * Register the given plugin descriptor with this plugin container.
   *
   * Once a plugin is registerred, it will be loaded when
   * {@see App.prototype.start} is called.
   *
   * Calling register with the same plugin multiple times results in noops.
   *
   * @param {Object} descriptor A valid plugin descriptor. {@see Plugin.isValid}
   *
   * @return {Plugin} The Plugin instance created.
   */
  register(descriptor){

    var app = this;

    if(!Plugin.isValid(descriptor)){
      throw new TypeError(
        "The object being registered is not a valid plugin. " +
        "In order to be valid, the plugin must be an object with a start function."
      );
    }

    if(app.isRegistered(descriptor)){
      return app._plugins.get(descriptor);
    }

    var plugin = new Plugin(app, descriptor);
    app._plugins.set(descriptor, plugin);

    return plugin;

  };

  /**
   * Determine whether the given plugin is registerred on this container.
   *
   * @param {Object} descriptor The plugin descriptor.
   *
   * @return {Boolean}
   */
  isRegistered(descriptor){
    return this._plugins.has(descriptor);
  };

  /**
   * Await the initialization of one or more plugins.
   *
   * This is a convenience method over {@see App.prototype.start}. Rather than
   * giving it a single plugin descriptor, it accepts one or more strings that
   * are resolved to files by {@see App.prototype.resolvePluginPath} and then
   * required to get the descriptors.
   *
   * @return {Promise} A promise which resolves once the plugins by the given
   *                   names have all started.
   */
  await(){

    //Meh.
    var app = this;

    //Iterate over the given arguments.
    return Promise.map(Array.prototype.slice.call(arguments), function(name){

      //Resolve the name to a descriptor.
      var descriptor = require(app.resolvePluginPath(name));

      //Throw if the dependency is not met.
      if(!app.isRegistered(descriptor)){
        throw new Error("Failed to meet a dependency for " + name);
      }

      //Get a promise for this descriptor.
      return app.getPromiseFor(descriptor);

    });

  };

  /**
   * Determine when the plugin described by the given descriptor has loaded.
   *
   * @param {Object} descriptor The plugin descriptor.
   *
   * @return {Promise} A promise which resolves once the plugin has started.
   */
  getPromiseFor(descriptor){

    //Meh.
    var app = this;

    //Create the promise.
    return new Promise(function(resolve, reject){

      //If the plugin is not even registerred, reject the promise.
      if(!app.isRegistered(descriptor)){
        reject(new Error("No plugin registered for given descriptor."));
      }

      //Fetch the associated Plugin instance.
      var plugin = app._plugins.get(descriptor);

      //Check the state of the Plugin.
      switch(plugin.state){

        //If the plugin is already active, resolve the promise.
        case Plugin.ACTIVE: return resolve();

        //If the plugin has already failed, reject the promise.
        case Plugin.FAILED: return reject();

        //Otherwise, listen to the plugin to determine when it happens.
        default: plugin.once('start', resolve).once('fail', reject);

      }

    });

  };

  /**
   * Resolve the given plugin name to its full path.
   *
   * Basically just stitches together `options.pluginDirectory` and the given name.
   *
   * @param {String} name The name of the plugin.
   *
   * @return {String} The full path to the plugin.
   */
  resolvePluginPath(name){

    return path.resolve(this._options.pluginDirectory, name);

  };

  /**
   * Start the app by starting all registerred plugins.
   *
   * @param {Number} timeout The time (in milliseconds) you give your app to
   *                         start. Defaults to 30 seconds. Setting this value
   *                         to anything other than a number between 0 and
   *                         Infinity disables the timeout altogether.
   *
   * @return {Promise} A promise which resolves once all plugins have started.
   *                   This promise rejects if one or more plugins fail to load.
   *                   This promise rejects if the timeout is reached.
   */
  start(timeout){

    //Meh.
    var app = this;

    //Promises of plugins.
    var promises = [];

    //Set a default timeout?
    if(arguments.length === 0) timeout = 30000;

    //Call start for every plugin.
    for(let plugin of app._plugins.values()){
      promises.push(plugin.start().tap(function(){
        app._started.push(plugin);
      }));
    }

    //Just await the resolution of all startup promises if we have no timeout.
    if(isNaN(timeout) || timeout < 0 || timeout >= Infinity){
      return Promise.all(promises);
    }

    //Create the final Promise.
    return new Promise(function(resolve, reject){

      //Set a timeout to reject the promise after we time out.
      var tid = setTimeout(reject.bind(null, new Error(
        "Application startup timed out. This can happen if a deadlock is" +
        "created by several plugins all awaiting eachother in a circle." +
        ""
      )), timeout||30000);

      //Await the resolution of all startup promises.
      Promise.all(promises).tap(clearTimeout.bind(null, tid)).done(resolve, reject);

    });

  };

  /**
   * End the app by ending all the plugins.
   *
   * @return {Promise} A promise which resolves once all plugins have ended.
   */
  end(){

    //Iterate over the started plugins in reverse order and call their end methods.
    return Promise.each(this._started.reverse(), function(plugin){
      return plugin.end();
    });

  };

};

//Export our class.
module.exports = App;
