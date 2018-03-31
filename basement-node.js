#!/usr/bin/env node
'use strict'

// IMPORTS
const Flow = require('flow-code-description');
const {LOG, ERR, TIME} = (require('./src/utils/node-console'))({log: true, errors: true});
const Load = require('./src/utils/node-loader');
const STORAGE = Load();
const CORE = require('./src/knowkeep');
// const UTIL = require('./utils/helpers');


const BASEMENT = new Flow({
  steps: {
    'start': bootstrap,
    'config is loaded': finish,
    'app is bootstrapped': finish,
  },
  settings: { isLogging: true },
});
BASEMENT.start('app is started');


function bootstrap() {
  STORAGE.bootstrap(
    config => BASEMENT.done('app is bootstrapped', config)
  );
}
function getInterface() {
  STORAGE.getInterface(
    content => BASEMENT.done('interface is loaded', content)
  );
}


function finish(arg) {
  ERR('loaded!', arg);
  process.exit(1);
}
