#!/usr/bin/env node

// IMPORTS
const HOMEDIR = require('os').homedir();
const PATH = require('path');
const EXEC = require('child_process').exec;
const FILE = require('fs-handy-wraps');
const BRIEF = require('brief-async');
const { LOG, ERR } = (require('./src/node/console'))({ log: true, errors: true });
const MODEL = (require('./src/node/model'))();
const VIEW = (require('./src/node/view'))();


const BASEMENT = {
  homedir: PATH.join(HOMEDIR, 'knowkeep'),
};
const CONTROLLER = {
  skipEvent: false,
};

const BOOTSTRAP = [
  [BASEMENT.homedir],       getDir,
  [getDir, 'config.json'],  getConfig,
  [getConfig],              initModel, initView,
  [initModel, initView],    initialRender,
  [initialRender],          openTextEditor, initController,
  [openTextEditor, initController], finishInit,
];
const INPUT_PROCESSING = [
  ['input will be here'],   validateInput,
  [validateInput],          processInput,
  [processInput],           render,
];


BRIEF(BOOTSTRAP, crashApp, true); // <-- entry point


// PREPARATIONS
function getDir(dir, resolve) {
  FILE.makeDir(
    dir,
    () => resolve(dir),
  );
}
function getConfig(args, resolve) {
  const dir = args[0];
  const configFileName = PATH.join(dir, args[1]);
  const defaults = {
    pathToBase:             PATH.join(dir, 'base.note'),
    pathToBaseTemplate:     PATH.join(dir, 'template_base.txt'),
    pathToInterface:        PATH.join(dir, 'new.note'),
    pathToInterfaceTemplate:PATH.join(dir, 'template_interface.txt'),
    pathToTreeTemplate:     PATH.join(dir, 'template_tree.txt'),
    editor: 'subl',
    bases: [{ alias: 'first', path: 'base.txt' }],
  };
  const CLIQuestions = [
    { prop: 'pathToBase', question: 'New config-file will be created. Please, answer on 3 questions. \nFull path to database file (with filename):' },
    { prop: 'pathToInterface', question: 'Path to new Note file:' },
    { prop: 'editor', question: 'Shell command to open your text editor:' },
  ];

  FILE.getConfig(
    configFileName,
    storeConfigData,
    defaults,
    CLIQuestions,
  );

  function storeConfigData(config) {
    BASEMENT.config = config;
    resolve(config);
  }
}
function finishInit(args, resolve) {
  LOG('App is loaded and ready');
  resolve(true);
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
function processInput(input, resolve) {
  const result = MODEL.gotUserInput(input);

  resolve(result);
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
function initialRender(args, resolve) {
  const { data, dataType } = args[0];
  const { view, isOutdated } = args[1];
  view.text = data;

  CONTROLLER.skipEvent = false;
  if ((dataType === 'flat') || (isOutdated)) {
    VIEW.render(view, resolve);
  } else {
    resolve(true);
  }
}
function openTextEditor(args, resolve, reject) {
  const { config } = BASEMENT;
  const shellCommand = `${config.editor} ${config.pathToInterface}`;
  LOG(`opening Text Editor by command: ${shellCommand}`);


  // An example of working shell command for Windows CMD:
  // shellCommand = 'start "" "c:\\Program Files\\Sublime Text 3\\sublime_text.exe"';

  EXEC(shellCommand, cb);
  function cb(error, stdout, stderr) {
    if (error)  {
      ERR('error:', error);
      reject('can not open editor');
      if (stderr) ERR('stderr:', stderr);
    } else {
      resolve(true);
    }
  }
}
function render(view, resolve) {
  if (view.needRender) {
    CONTROLLER.skipEvent = true;
    VIEW.render(view);
  }

  resolve(true);
}

// CONTROLLER (USER INPUT)
function initController(args, resolve) {
  const { pathToInterface } = BASEMENT.config;

  FILE.watch(pathToInterface, readInterfaceFile);
  LOG('detecting changes of Interface File...');
  resolve(true);

  function readInterfaceFile() {
    // called every time the interfaceFile is saved.
    // interfaceFile must be read only after external changes made by User
    // interfaceFile will be updated by the program right after user input
    // that update must not be catched
    if (CONTROLLER.skipEvent) {
      CONTROLLER.skipEvent = false; // skipping, not reading
      return;
    }

    FILE.read(
      pathToInterface,
      (content) => {
        INPUT_PROCESSING[0][0] = content; // first argument for Brief
        BRIEF(INPUT_PROCESSING, inputErrHandler);
      },
    );
  }
}
function validateInput(string, resolve, reject) {
  const diagnosis = VIEW.validate(string);

  if (diagnosis.isOk) {
    resolve(diagnosis.data);
  } else {
    CONTROLLER.skipEvent = true;
    VIEW.showErrorMessage();
    reject(diagnosis.error);
  }
}
function inputErrHandler(err) {
  ERR('hello, catched error!', err);
}


// EXIT
function crashApp(arg) {
  ERR('App was crashed. Reason:', arg);
  process.exit(1);
}
// function closeApp() {
//   LOG('Tot ziens!');
//   // process.exit(1);
// }
