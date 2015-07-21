# Hub - Version 0.1.0 Beta

Slim Javascript application service manager. Similar to the old
[Broadway](https://github.com/indexzero/broadway/tree/v0.3.6) but with more
generators and promises.

## Docs

### Dependencies

* Requires `--harmony`.
* [bluebird]: Promises.

[bluebird]: https://github.com/petkaantonov/bluebird/blob/master/API.md

### Example

Your main file might look something like:

```js
var App = require("@avaq/hub");
var app = new App({pluginDirectory: "./plugins"});

//Register plugins with the app. The plugins are looked up in the pluginDirectory.
app.use("my-plugin");
app.use("my-other-plugin");

//Start the app, which resolves dependency structure and initializes plugins.
app.start();
```

Every plugin looks like:

```js
//Startup coroutine.
exports.start = function*(app){

  //Asynchronously await the startup of another plugin before continueing.
  yield app.await("my-other-plugin");

  //Register my own service by mutating the app.
  app.myService = new MyService();

};

//Shutdown coroutine.
exports.end = function*(){

  //Gracefully shut down the service.
  yield app.myService.close();

  //Unregister.
  delete app.myService;

};
```

### Dev dependencies

* [mocha]: Test runner.
* [chai]: Assertions.
* [sinon]: Stubbing.

[mocha]: http://mochajs.org/
[chai]: http://chaijs.com/api/bdd/
[sinon]: http://sinonjs.org/docs/
