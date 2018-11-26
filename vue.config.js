/**
  vue.config.js 
  
  is an optional config file that will be automatically loaded by @vue/cli-service 
  if it's present in your project root (next to package.json). 
  You can also use the vue field in package.json, 
  but do note in that case you will be limited to JSON-compatible values only.
*/
var path = require('path');

module.exports = {
  // options...
  
  configureWebpack: {

      devServer: {
          contentBase: path.join(__dirname, 'src', 'assets'), // <--- Content not from webpack is served from this dir
          port: 5000
      },}
  
}