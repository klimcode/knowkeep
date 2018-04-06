#!/usr/bin/env node
'use strict'
// IMPORTS
  const PATH = require('path');
  const FILE = require('fs-handy-wraps');
  const BRIEF = require('async-brief');
  const {LOG, ERR, TIME} = (require('./src/node/console'))({log: true, errors: true});
  const MODEL = (require('./src/node/model'))();
  const VIEW = require('./src/node/view');


const BASEMENT = {
  homedir: PATH.join (require('os').homedir(), 'knowkeep'),
  settings: { isLogging: true },
};
let CONTROLLER = {
  skipEvent: false,
};

const BOOTSTRAP = BRIEF([
  [BASEMENT.homedir],       getDir,
  [getDir, 'config.json'],  getConfig,
  [getConfig],              initModel, initView,
  [initModel, initView],    prepareInterface,
  [prepareInterface],       initialRender,
  [initialRender],          openTextEditor, initController
]);
const INPUT_PROCESSING = [
  ['place input here'],     validateInput,
  [validateInput],          processInput,
];

// PREPARATIONS
function getDir(dir, resolve) {
  FILE.makeDir (
    dir,
    () => resolve(dir)
  );
}
function getConfig(args, resolve) {
  const dir = args[0];
  const configFileName = PATH.join(dir, args[1]);
  const defaults = {
    pathToBase:             PATH.join( dir, 'base.note' ),
    pathToBaseTemplate:     PATH.join( dir, 'template_base.txt' ),
    pathToInterface:        PATH.join( dir, 'new.note' ),
    pathToInterfaceTemplate:PATH.join( dir, 'template_interface.txt' ),
    pathToTreeTemplate:     PATH.join( dir, 'template_tree.txt' ),
    editor: 'subl',
    bases: [{ alias: "first", path: "base.txt" }],
  };
  const CLIQuestions = [
    { prop: 'pathToBase', question: 'New config-file will be created. Please, answer on 3 questions. \nFull path to database file (with filename):' },
    { prop: 'pathToInterface', question: 'Path to new Note file:' },
    { prop: 'editor', question: 'Shell command to open your text editor:' },
  ];

  FILE.getConfig (
    configFileName,
    storeConfigData,
    defaults,
    CLIQuestions
  );

  function storeConfigData (config) {
    BASEMENT.config = config;
    resolve(config);
  }
}

// MODEL (WORKING WITH DATA)
function initModel(config, resolve, reject) {
  MODEL.init(config, cb);

  function cb(answer) {
    if (answer && answer.error) {
      ERR('MODEL crushed during initialization', answer.error);
      reject(answer.error);
    } else {
      resolve(answer);
    }
  }
}
function prepareInterface (args, resolve) {
  const data = args[0];
  const view = args[1];

  view.text = data;
  resolve(view);
}

// VIEW (RENDERING TO FILE)
function initView(config, resolve, reject) {
  VIEW.init(config, cb);

  function cb(answer) {
    if (answer && answer.error) {
      ERR('View crushed during initialization', answer.error);
      reject(answer.error);
    } else {
      resolve(answer);
    }
  }
}
function initialRender(data, resolve) {
  CONTROLLER.skipEvent = false;
  VIEW.render(data, resolve);
}
function openTextEditor() {
  const config = BASEMENT.config;
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
function initController() {
  const pathToInterface = BASEMENT.config.pathToInterface;
  LOG ('detecting changes of Interface File...');


  FILE.watch (pathToInterface, readInterfaceFile);


  function readInterfaceFile() {
    // called every time the interfaceFile is saved.
    // interfaceFile must be read only after external changes made by User
    // interfaceFile will be updated by the program right after user input
    // that update must not be catched
    if (CONTROLLER.skipEvent)
      return CONTROLLER.skipEvent = false; // skipping, not reading

    FILE.read (
      pathToInterface,
      (content) => {
        INPUT_PROCESSING[0][0] = content;
        BRIEF(INPUT_PROCESSING, inputErrHandler);
      }
    );
  }
}
function validateInput(string, resolve, reject) {
  const diagnosis = VIEW.validate(string);

  if (diagnosis.ok) {
    resolve(diagnosis.result);
  } else {
    CONTROLLER.skipEvent = true;
    VIEW.showErrorMessage();
    reject(diagnosis.error);
  }
}
function processInput(input, resolve) { // SYNCHRONOUS !
  //let result = MODEL.think (input);
  let result = input;
  console.log('wip', result);
  CONTROLLER.skipEvent = true;
  VIEW.render(input);
  resolve(result);
}
function inputErrHandler(err) {
  ERR('hello, catched error!', err);
}


// EXIT
function crashApp(arg) {
  ERR('details:', arg);
  process.exit(1);
}
function closeApp() {
  LOG('Tot ziens!');
  // process.exit(1);
}
