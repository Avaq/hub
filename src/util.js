var util = require('util');
var Promise = require('bluebird');

//Set the exports to a new object which uses util as a parent object.
util = module.exports = exports = Object.create(util);

/**
 * Determine whether the given function is a GeneratorFunction.
 *
 * @param {Function} fn The function to test.
 *
 * @return {Boolean}
 */
util.isGenerator = function(fn){
  return fn.constructor.name === 'GeneratorFunction';
};

/**
 * Wrap the given function to always return a Promise.
 *
 * When given a Function, it is wrapped by Promise.method to return a Promise
 * of the return value, and resolve thennables.
 *
 * When given a GeneratorFunction, it is wrapped by Promise.coroutine to return
 * a Promise of the final return value of the generator, after each next value
 * has been resolved.
 *
 * @param {Function} fn A Function or GeneratorFunction.
 *
 * @return {Function} The wrapped result.
 */
util.promise = function(fn){
  return (util.isGenerator(fn) ? Promise.coroutine(fn) : Promise.method(fn));
};
