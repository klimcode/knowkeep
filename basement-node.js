#!/usr/bin/env node
'use strict'

// IMPORTS
const Flow = require('flow-code-description');
const {LOG, ERR, TIME} = (require('./src/utils/node-console'))({log: true, errors: true});
const STORAGE = (require('./src/utils/node-storage'))();
const CORE = require('./src/knowkeep');
const FILE = require('fs-handy-wraps');


const BASEMENT = new Flow({
  steps: {
    'start': initModel,
    'storage is ready': renderView,
    'interface file is ready': [openTextEditor, initController],
    
    'user entered something': closeApp,

    'storage crushed during bootstrapping': crashApp,
    'interface is broken': closeApp,
    'end': closeApp,
  },
  settings: { isLogging: true },
});
BASEMENT.start('app is started');

let STATE = {
  isStartup: true,
};


function initModel() {
  STORAGE.bootstrap(processResults);

  function processResults(res) {
    if (res && res.error) {
      BASEMENT.done('storage crushed during bootstrapping', res.error);
    } else {
      BASEMENT.done('storage is ready', res)
    }
  }
}
function renderView() {
  const pathToInterface = STORAGE.getConfig().pathToInterface;
  const view = STORAGE.getView();

  FILE.write(
    pathToInterface,
    view,
    () => STATE.isStartup && BASEMENT.done ('interface file is ready') // this is performed only once
  );
}
function initController() {
  const pathToInterface = STORAGE.getConfig().pathToInterface;
  LOG ('detecting changes of Interface File...');


  FILE.watch (pathToInterface, readInterfaceFile);


  function readInterfaceFile() { 
    // called every time interfaceFile is saved
    // interface must be read only after external changes made by User
    // internal changes affect on a "skipViewEvent" Flag only
    if (STATE.skipViewEvent) return STATE.skipViewEvent = false;

    FILE.read (
      pathToInterface,
      parseInterface
    );

    function parseInterface (content) {
      let data = STORAGE.parseView (content);

      if (!data) return BASEMENT.done ('interface is broken');

      // data.tags = UTIL.prettifyList (data.tags);

      BASEMENT.done('user entered something', data);
    }
  }
}
function openTextEditor() {
  STATE.isStartup = false;

  const config = STORAGE.getConfig();
  const shellCommand = `${config.editor} ${config.pathToInterface}`;
  LOG(`opening Text Editor by command: ${shellCommand}`);

  // An example of working shell command for Windows CMD:
  // shellCommand = 'start "" "c:\\Program Files\\Sublime Text 3\\sublime_text.exe"';

  require('child_process').exec (shellCommand, cb);
  function cb(error, stdout, stderr) {
    error &&  ERR('error: ', error);
    stdout && ERR('stdout: ', stdout);
    stderr && ERR('stderr: ', stderr);
  }
}



function closeApp(arg) {
  LOG('Tot ziens!', arg);
  process.exit(1);
}
function crashApp(arg) {
  ERR('details:', arg);
  process.exit(1);
}
