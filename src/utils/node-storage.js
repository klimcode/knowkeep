const Flow = require('flow-code-description');
const FILE = require('fs-handy-wraps');
const PATH = require('path');
const PARSER = require('parser-template');
const {LOG, ERR, TIME} = (require('./node-console'))({log: true, errors: true});

const LOADER = new Flow({
  steps: {
    'loading is started': readConfigFile,
    'config is OK': [ getBase, getBaseTemplate, getInterfaceTemplate ],
    'database is OK': parseBase,
    'template for database is OK': parseBase,
    'base is parsed': checkLoadingFinish,
    'user interface is prepared': checkLoadingFinish,

    'loading is finished': sendResult,
    'loading is failed': sendResult,
  },
  settings: { isLogging: true, logName: 'loader: ', logStyle: '\x1b[2m%s\x1b[0m' },
});

const MODEL = new Flow({
  steps: {
    'record is requested': getRecord,
  },
  settings: { isLogging: true, logName: 'storage: ', logStyle: '\x1b[2m%s\x1b[0m' },
});


let SETTINGS = {};
let STORAGE = {
  statusDir: false,
  config: {},
  base: {},
  view: {},
};

  
// INTERNAL FUNCTIONS
function checkDir(nextStep) {
  FILE.makeDir (
    SETTINGS.dir,
    () => LOADER.done (nextStep)
  );
}
function readConfigFile() {
  const dir = SETTINGS.dir;
  const configDefaults = {
    pathToBase:             PATH.join( dir, 'base.note' ),
    pathToBaseTemplate:     PATH.join( dir, 'template_base.txt' ),
    pathToInterface:        PATH.join( dir, 'new.note' ),
    pathToInterfaceTemplate:PATH.join( dir, 'template_interface.txt' ),
    pathToTreeTemplate:     PATH.join( dir, 'template_tree.txt' ),
    editor: 'subl',
    bases: [{ alias: "first", path: "base.txt" }],
  };
  const configCLIQuestions = [
    { prop: 'pathToBase', question: 'New config-file will be created. Please, answer on 3 questions. \nFull path to database file (with filename):' },
    { prop: 'pathToInterface', question: 'Path to new Note file:' },
    { prop: 'editor', question: 'Shell command to open your text editor:' },
  ];
  
  FILE.getConfig (
    SETTINGS.pathToConfig,
    storeConfigData,
    configDefaults,
    configCLIQuestions
  );

  function storeConfigData (config) {
    STORAGE.config = config;
    LOADER.done('config is OK');
  }
}
function getBase() {
  LOG (`Database file: ${STORAGE.config.pathToBase}`);
  FILE.readOrMake(
    STORAGE.config.pathToBase,
    readBase,
    processNewBase
  );


  function processNewBase (path, content) {
    LOG (`created database file: ${path}`);
    readBase (content);
  }
  function readBase (content) {
    STORAGE.base.raw = content;
    LOADER.done ('database is OK', content);
  }
}
function getBaseTemplate() {
  let defTemplateText =
  '<><name>\n' +
  '<><tags>\n' +
  '<m><text>\n' +
  '==============================================================================\n';


  LOG (`Database template: ${STORAGE.config.pathToBaseTemplate}`);
  FILE.readOrMake (
    STORAGE.config.pathToBaseTemplate,
    readTemplate,
    processDefTemplate,
    defTemplateText,
  );


  function processDefTemplate (path, content) {
    LOG (`created file for Base Template: ${path}. You may edit it manually.`);
    readTemplate (content);
  }
  function readTemplate (template) {
    STORAGE.base.parser = new PARSER (template);
    LOADER.done('template for database is OK');
  }
}
function parseBase() {
  const baseBarser = STORAGE.base.parser;
  if (STORAGE.base.raw === undefined || !baseBarser) return;   // async race


  let data;
  if (STORAGE.base.raw === '') {
    data = baseBarser.parse (baseBarser.template)  // New empty base
    STORAGE.emptyBase = true;
  }
  else data = baseBarser.parse (STORAGE.base.raw);
  delete STORAGE.base.raw;


  data = data instanceof Array ? data : [data]; // if Parser returned only one Record object -> enforce it to be an array.
  data = data.filter (record => record.text.trim()); // remove empty records
  data.forEach (record => record.tags = record.tags.trim().split (', ')); // convert tags to Array

  STORAGE.base.data = data;
  
  LOADER.done ('base is parsed');
}
function getInterfaceTemplate() {
  let defTemplateText =
  '<m><text>' +
  '\n================================== name ======================================\n' +
  '<><name>' +
  '\n================================== tags ======================================\n' +
  '<><tags>' +
  '\n================================ commands ====================================\n' +
  '<m>add<command>' +
  '\n========================== tags used previously ==============================\n' +
  '<>any tag<tags_used>\n';


  LOG(`Interface template: ${STORAGE.config.pathToInterfaceTemplate}`);
  FILE.readOrMake(
    STORAGE.config.pathToInterfaceTemplate,
    readTemplate,
    processDefTemplate,
    defTemplateText
  );


  function processDefTemplate (path, content) {
    LOG(`created file for Interface Template: ${path}. You may edit it manually.`);
    readTemplate(content);
  }
  function readTemplate(template) {
    let viewParser = new PARSER(template);
    STORAGE.view.parser = viewParser;
    STORAGE.view.data = viewParser.parse(template)[0];
    STORAGE.view.defData = STORAGE.view.data;

    LOADER.done('user interface is prepared');
  }
}
function checkLoadingFinish() {
  const base = STORAGE.base.data;
  const interface = STORAGE.view.data;
  if (!base || !interface) return;   // async race

  LOADER.done('loading is finished')
}



function getRecord(result) {

  STORAGE.cb(result);
}


function sendResult(result) {
  STORAGE.cb(result);
}



module.exports = function(customSettings) {
  const loaderDefSettings = {
    folderName: 'knowkeep',
    configFileName: 'config.json',
  };

  SETTINGS = Object.assign(loaderDefSettings, customSettings);
  SETTINGS.dir = PATH.join(require('os').homedir(), SETTINGS.folderName);
  SETTINGS.pathToConfig = PATH.join(SETTINGS.dir, SETTINGS.configFileName);

  // PUBLIC FUNCTIONS
  return {
    bootstrap(exitCallback) {
      STORAGE.cb = exitCallback;
      checkDir('loading is started');
    },
    getConfig() {
      return STORAGE.config;
    },
    parseView(string) {
      return STORAGE.view.parser.parse(string)[0];
    },
    getView(content) {
      return STORAGE.view.parser.stringify(content ? content : STORAGE.view.data);
    },
  }
}