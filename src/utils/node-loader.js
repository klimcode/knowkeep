const Flow = require('flow-code-description');
const FILE = require('fs-handy-wraps');


const LOADER = new Flow({
  steps: {
     // 'start': bootstrap,
  },
  settings: {},
});
// LOADER.start();


const defSettings = {
  homedir: 'knowkeep',
  configFileName: 'config.json',
};


module.exports = function(settings) {

  return {
    getConfig(cb) {
      cb({});
    }
  }
}
