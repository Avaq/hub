var path = require('path');
var App = require('../');
var thenLog = function(message){return console.log.bind(console, message)};

global.app = new App({pluginDirectory: path.resolve(__dirname, 'plugins')});

app.use('a').on('start', thenLog('A started')).on('end', thenLog('A ended'));
app.use('b').on('start', thenLog('B started')).on('end', thenLog('B ended'));
app.use('c').on('start', thenLog('C started')).on('end', thenLog('C ended'));

app.start()

.then(function(){
  console.log("APP started", {a:app.a, b:app.b, c:app.c});
})

.catch(function(err){
  console.error("App failed to start.");
  console.error(err.stack);
  process.exit(1);
})

.then(function(){
  return app.end();
})

.then(function(){
  console.log("APP ended", {a:app.a, b:app.b, c:app.c});
})

.catch(function(err){
  console.error("App failed to shut down properly.");
  console.error(err.stack);
  process.exit(2);
});
