#!/usr/bin/env node
'use strict'

// IMPORTS
const Flow = require('flow-code-description');
const UTIL = require('./utils/helpers');
const {LOG, ERR} = (require('./utils/console'))({log: true});

// GLOBAL STUFF
// const G = {
//     isLogging: true,
// };
const CORE = new Flow({
    steps: {
        'start': bootstrap,
    },
    settings: {},
});

CORE.done('start');

function bootstrap () {
    LOG ('loaded!');
}
