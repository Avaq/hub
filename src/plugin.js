"use strict";
var Promise = require('bluebird');
var util = require('./util');
var EventEmitter = require('events').EventEmitter;

/**
 * Represents a single plugin.
 *
 * @event start Triggered when the plugin has successfully started.
 * @event fail Triggered when the plugin has failed to start.
 * @event end Triggered when the plugin has successfully ended.
 *
 * @type {Plugin}
 * @type {EventEmitter}
 */
class Plugin extends EventEmitter {

  /**
   * Constructs a Plugin.
   *
   * @param {App} container The service locator to which the plugin should attach.
   * @param {Object} descriptor A plugin descriptor is an object with a start
   *                            method and an optional end method.
   *                            {@see Plugin.prototype.start}
   */
  constructor(container, descriptor){

    //Given container must be an instance of App.
    if(!(container instanceof require('./app'))){
      throw new TypeError("Expected container to be an instance of App");
    }

    //The given plugin descriptor must be a valid descriptor.
    if(!Plugin.isValid(descriptor)){
      throw new TypeError("Given plugin descriptor is not valid.");
    }

    //Construct the EventEmitter.
    super();

    //Construct the Plugin.
    this.container = container;
    this.descriptor = descriptor;
    this.state = Plugin.INACTIVE;

  };

  /**
   * Start the plugin.
   *
   * Calls the descriptors start method, passing in the container (the App
   * instance). The start function is expected to attach the services it wishes
   * to register to the container by simply mutating the containers properties,
   * and to intialize its services.
   *
   * The return value from the called start function is always turned into a
   * Promise which is then returned from this method. This means that if the
   * return value is a thenable, it is cast to a Bluebird Promise. If it's a
   * Generator, it is executed in a coroutine and the resulting Promise will
   * resolve once the generator returns {done:true}.
   *
   * @event start Triggered when the promise resolves.
   * @event fail Triggered when the promise rejects.
   *
   * @return {Promise} The promise of the descriptors start function.
   */
  start(){

    //Meh.
    var plugin = this;

    //Throw if the plugin is already active.
    if(plugin.state === Plugin.ACTIVE){
      throw new Error("This plugin is already running.");
    }

    //Throw if the plugin is already pending.
    if(plugin.state === Plugin.PENDING){
      throw new Error("This plugin is already starting up.");
    }

    //Set the plugin to pending.
    plugin.state = Plugin.PENDING;

    //Ensure the start function returns a promise and call it with the container.
    return util.promise(plugin.descriptor.start).call(plugin, plugin.container)

    //Once the promise has resolved we set our internal state to active, and emit start.
    .tap(function(){
      plugin.state = Plugin.ACTIVE;
      plugin.emit('start');
    })

    //If the promise rejects we set our internal state to failed, and emit fail.
    .catch(function(err){
      plugin.state = Plugin.FAILED;
      plugin.emit('fail', err);
      throw err;
    });

  };

  /**
   * End the plugin.
   *
   * Calls the descriptors end method if it exists, passing in the container
   * (the App instance). The end function is expected to basically clean up
   * and trace of the services attached by start. This includes unbinding
   * events, unlistening to ports and deleting the service properties from the
   * container.
   *
   * The return value is promisified in the same way as
   * {@see Plugin.prototype.start} does.
   *
   * @event end Triggered when the promise resolves.
   * @event fail Triggered when the promise rejects.
   *
   * @return {Promise} The promise of the descriptors end function.
   */
  end(){

    //Meh.
    var plugin = this;

    //The plugin must be running when we call end.
    if(plugin.state !== Plugin.ACTIVE){
      throw new Error("This plugin is not running.");
    }

    //Set the state back to pending.
    plugin.state = Plugin.PENDING;

    //Call the end function if it exists.
    return (typeof plugin.descriptor.end === 'function'
      ? util.promise(plugin.descriptor.end).call(plugin, plugin.container)
      : Promise.resolve()
    )

    //Once the promise resolves we set the internal state to inactive and emit end.
    .tap(function(){
      plugin.state = Plugin.INACTIVE;
      plugin.emit('end');
    })

    //If the promise rejects we set the internal state back to active and emit fail.
    .catch(function(err){
      plugin.state = Plugin.ACTIVE;
      plugin.emit('fail', err);
      throw err;
    });

  };

};

//Plugin states.
Plugin.INACTIVE = 0;
Plugin.PENDING = 1;
Plugin.ACTIVE = 2;
Plugin.FAILED = 3;

/**
 * Determine if the given object is a valid plugin descriptor.
 *
 * @param {Object} descriptor The potential plugin descriptor.
 *
 * @return {Boolean}
 */
Plugin.isValid = function(descriptor){
  return typeof descriptor === 'object' && typeof descriptor.start === 'function';
};

//Export our class.
module.exports = Plugin;
