// IMPORTS
  const BRIEF = require('../brief');
  const Flow = require('flow-code-description');
  const FILE = require('fs-handy-wraps');
  const PARSER = require('parser-template');
  const BRAIN = require('../knowkeep');
  const {LOG, ERR, TIME, MEM} = (require('./console'))({log: true, errors: true});

let STORAGE = {
  statusDir: false,
  base: {},
};


// INTERNAL FUNCTIONS
function getBase(args, resolve) {
  const config = args;

  LOG (`Database file: ${config.pathToBase}`);
  FILE.readOrMake(
    config.pathToBase,
    readBase,
    processNewBase
  );


  function processNewBase (path, content) {
    LOG (`created database file: ${path}`);
    readBase (content);
  }
  function readBase (content) {
    STORAGE.base.raw = content;
    resolve(content);
  }
}
function getBaseTemplate(args, resolve) {
  const config = args;

  const defTemplateContent =
  '<><name>\n' +
  '<><tags>\n' +
  '<m><text>\n' +
  '==============================================================================\n';


  LOG (`Database template: ${config.pathToBaseTemplate}`);
  FILE.readOrMake (
    config.pathToBaseTemplate,
    readTemplate,
    processDefTemplate,
    defTemplateContent,
  );


  function processDefTemplate (path, content) {
    LOG (`created file for Base Template: ${path}. You may edit it manually.`);
    readTemplate (content);
  }
  function readTemplate (template) {
    const parser = new PARSER (template);
    STORAGE.base.parser = parser;
    resolve(parser);
  }
}
function parseBase(args, resolve) {
  const dataRaw = args[0];
  const baseBarser = args[1];

  let data;
  if (dataRaw === '') {
    data = baseBarser.parse (baseBarser.template)  // New empty base
    STORAGE.emptyBase = true;
  } else {
    data = baseBarser.parse (dataRaw);
  }

  data = data instanceof Array ? data : [data]; // if Parser returned only one Record object -> enforce it to be an array.
  data = data.filter (record => record.text.trim()); // remove empty records
  data = BRAIN.parseTree (data);
  //data.forEach (record => record.tags = record.tags.trim().split (', ')); // convert tags to Array
  STORAGE.base.data = data;

  resolve(data);
}

function saveBase(data, resolve) {
  STORAGE.base.data = data;
}
function getRawBase(result, resolve) {
  STORAGE.cb(STORAGE.base.raw);
}


module.exports = function(customSettings) {
  // PUBLIC FUNCTIONS
  return {
    init(config, resolve) {
      STORAGE.config = config;
      STORAGE.cb = resolve;
      const STEPS = BRIEF([
        [config],                   getBase, getBaseTemplate,
        [getBase, getBaseTemplate], parseBase,
        [parseBase],                getRawBase,
      ]);
    },
    gotUserInput(string) {
      debugger;
    },
    think(input, resolve) {
      const text = input.text;
      const userInputArr = STORAGE.base.parser.parse(text);
      const result = BRAIN.parseTree(userInputArr);


      saveBase(result);
    }
  }
}
