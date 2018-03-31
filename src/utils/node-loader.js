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
    'data for view is prepared': checkLoadingFinish,

    'bootstrap is finished': answer,
  },
  settings: { isLogging: true, logName: 'node-loader: ' },
});


const loaderDefSettings = {
  folderName: 'knowkeep',
  configFileName: 'config.json',
};
let SETTINGS = {};
let STORAGE = {
  statusDir: false,
  configContent: null,
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
    pathToInterfaceTemplate: PATH.join( dir, 'template_interface.txt' ),
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
  LOG (`trying to read Database: ${STORAGE.config.pathToBase}`);
  FILE.readOrMake(
    STORAGE.config.pathToBase,
    storeBaseContent,
    newBaseCreated
  );


  function newBaseCreated (path, content) {
    LOG (`created database file: ${path}`);
    storeBaseContent (content);
  }
  function storeBaseContent (content) {
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


  LOG (`trying to read Template for Database: ${STORAGE.config.pathToBaseTemplate}`);
  FILE.readOrMake (
    STORAGE.config.pathToBaseTemplate,
    processTemplate,
    processDefTemplate,
    defTemplateText,
  );


  function processDefTemplate (path, content) {
    LOG (`created file for Base Template: ${path}. You may edit it manually.`);
    processTemplate (content);
  }
  function processTemplate (template) {
    STORAGE.base.parser = new PARSER (template);
    LOADER.done('template for database is OK');
  }
}
function parseBase() {
    const baseBarser = STORAGE.base.parser;
    let data;
    if (STORAGE.base.raw === undefined || !baseBarser) return;   // async race


    if (STORAGE.base.raw === '') {
        data = baseBarser.parse (baseBarser.template)  // New empty base
        STORAGE.emptyBase = true;
    }
    else data = baseBarser.parse (STORAGE.base.raw);
    delete STORAGE.base.raw;


    data = data instanceof Array ? data : [data]; // if Parser returned only one Record object -> enforce it to be an array.
    data.forEach (record => record.tags = record.tags.trim().split (', ')); // convert tags to Array
    data = data.filter (record => record.text.trim()); // remove empty records

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


    LOG (`trying to read Template for Interface: ${STORAGE.config.pathToInterfaceTemplate}`);
    FILE.readOrMake (
        STORAGE.config.pathToInterfaceTemplate,
        processTemplate,
        processDefTemplate,
        defTemplateText
    );


    function processDefTemplate (path, content) {

        LOG (`created file for Interface Template: ${path}. You may edit it manually.`);
        processTemplate (content);
    }
    function processTemplate (template) {
        let interfaceParser = new PARSER (template);
        STORAGE.view.parser = interfaceParser;
        STORAGE.view.data = interfaceParser.parse (template)[0];
        STORAGE.view.defData = STORAGE.view.data;

        LOADER.done('data for view is prepared');
    }
}
function checkLoadingFinish() {
  const base = STORAGE.base.data;
  const interface = STORAGE.view.data;
  if (!base || !interface) return;   // async race

  LOADER.done('bootstrap is finished', true)
}
function answer(result) {

  STORAGE.cb(result);
}



module.exports = function(customSettings) {
  SETTINGS = Object.assign(loaderDefSettings, customSettings);
  SETTINGS.dir = PATH.join(require('os').homedir(), SETTINGS.folderName);
  SETTINGS.pathToConfig = PATH.join(SETTINGS.dir, SETTINGS.configFileName);

  // PUBLIC FUNCTIONS
  return {
    bootstrap(exitCallback) {
      STORAGE.cb = exitCallback;
      checkDir('loading is started');
    },
    getData(cb) {
      cb({});
    },
  }
}