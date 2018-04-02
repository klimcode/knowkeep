#!/usr/bin/env node
'use strict'
// IMPORTS
  const Flow = require('flow-code-description');
  const {LOG, ERR, TIME} = (require('./src/utils/node-console'))({log: true, errors: true});
  const STORAGE = (require('./src/node-storage'))();
  const FILE = require('fs-handy-wraps');


const BASEMENT = new Flow({
  steps: {
    'start': initModel,
    'storage is ready': renderView,
    'interface file is ready': [openTextEditor, initController],
    
    'user entered something': validateInput,
    'user input is valid': processInput,
    'user input is processed': renderView,

    'interface is broken': showErrorMessage,
    'interface is restored by force': renderView,

    'storage crushed during bootstrapping': crashApp,
    'end': closeApp,
  },
  settings: { isLogging: true },
});
BASEMENT.start('app is started');

let STATE = {
  isStartup: true,
  skipViewEvent: false,
  needRestoration: false,
};


// MODEL (STORAGE + CORE)
function initModel(done) {
  STORAGE.bootstrap(processResults);

  function processResults(res) {
    if (res && res.error) {
      done('storage crushed during bootstrapping', res.error);
    } else {
      done('storage is ready', res)
    }
  }
}

// VIEW (USER INTERFACE)
function renderView(done, viewString) {
  const pathToInterface = STORAGE.getConfig().pathToInterface;
  const view = viewString || STORAGE.getView();

  if (!STATE.isStartup) STATE.skipViewEvent = true;

  FILE.write(
    pathToInterface,
    view,
    () => STATE.isStartup && done('interface file is ready') // this is performed only once
  );
}
function showErrorMessage(done, message) {
  const pathToInterface = STORAGE.getConfig().pathToInterface;
  const forcedRestoration = STATE.needRestoration; // it's false on the first appear
  let mesBroken = 
    '\n\n                        INTERFACE IS BROKEN \n'+
    'PLEASE, FIX IT MANUALLY OR IT WILL BE RESTORED WITH POSSIBLE DATA LOSS';
  let msg = message || mesBroken;
  
  
  if (forcedRestoration) {
    message = '';
    STATE.needRestoration = false;
  } else {
    ERR (msg);
    STATE.needRestoration = true;
  }
  
  STATE.skipViewEvent = true;
  FILE.append (
    pathToInterface,
    msg,
    () => forcedRestoration && done ('interface is restored by force') // rendering of restored interface
  );
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

// CONTROLLER (USER INPUT)
function initController(done) {
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
      (fileContent) => done('user entered something', fileContent)
    );
  }
}
function validateInput(done, data) {
  const diagnosis = STORAGE.validate(data);
  if (diagnosis.ok) {
    done('user input is valid', diagnosis.result);
  } else {
    done('interface is broken', diagnosis.error);
  }
}
function processInput(done, input) {
  let result = STORAGE.think (input);

  done ('user input is processed', result)
}



function crashApp(arg) {
  ERR('details:', arg);
  process.exit(1);
}
function closeApp() {
  LOG('Tot ziens!');
  process.exit(1);
}
