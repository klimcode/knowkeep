#!/usr/bin/env node
'use strict'

// IMPORTS
const Flow = require('flow-code-description');
const {LOG, ERR, TIME} = (require('./src/utils/node-console'))({log: true, errors: true});
const Load = require('./src/utils/node-loader');
const STORAGE = Load({ homedir: 'knowkeep' });
const CORE = require('./src/knowkeep');
// const UTIL = require('./utils/helpers');


const BASEMENT = new Flow({
  steps: {
    'start': bootstrap,
    'config is OK': finish,
  },
  settings: {},
});
BASEMENT.done('start');


function bootstrap() {

  STORAGE.getConfig(
    config => BASEMENT.done('config is OK', config)
  );
}
function finish() {
  ERR('loaded!');
  process.exit(1);
}
