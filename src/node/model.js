// IMPORTS
const BRIEF = require('brief-async');
const FILE = require('fs-handy-wraps');
const Parser = require('parser-template');
const BRAIN = require('../knowkeep');
const { LOG, ERR } = (require('./console'))({ log: true, errors: true });

const STORAGE = {
  statusDir: false,
  base: {},
};


// INTERNAL FUNCTIONS
function getBase(args, resolve, reject) {
  const config = args;

  LOG(`Database file: ${config.pathToBase}`);
  FILE.readOrMake(
    config.pathToBase,
    readBase,
    processNewBase,
    '',
    errHandler,
  );


  function processNewBase(path, content) {
    LOG(`created database file: ${path}`);
    readBase(content);
  }
  function readBase(content) {
    STORAGE.base.raw = content;
    resolve(content);
  }
  function errHandler(err) {
    ERR(`Can not write to file: ${config.pathToBase}`);
    reject(err);
  }
}
function getBaseTemplate(args, resolve, reject) {
  const config = args;

  const defTemplateContent =
  '<><name>\n' +
  '<><tags>\n' +
  '<m><text>\n' +
  '==============================================================================\n';


  LOG(`Database template: ${config.pathToBaseTemplate}`);
  FILE.readOrMake(
    config.pathToBaseTemplate,
    readTemplate,
    processDefTemplate,
    defTemplateContent,
    errHandler,
  );


  function processDefTemplate(path, content) {
    LOG(`created file for Base Template: ${path}. You may edit it manually.`);
    readTemplate(content);
  }
  function readTemplate(template) {
    const parser = new Parser(template);
    STORAGE.base.parser = parser;
    resolve(parser);
  }
  function errHandler(err) {
    ERR(`Can not write to file: ${config.pathToBaseTemplate}`);
    reject(err);
  }
}
function parseBase(args, resolve, reject) {
  const dataRaw = args[0];
  const baseBarser = args[1];

  let data;
  if (dataRaw === '') {
    data = baseBarser.parse(baseBarser.template); // New empty base
    STORAGE.emptyBase = true;
  } else {
    data = baseBarser.parse(dataRaw);
  }

  if (data) {
    // if Parser returned only one Record object -> enforce it to be an array.
    data = data instanceof Array ? data : [data];
    data = data.filter(record => record.text.trim()); // remove empty records
    data = BRAIN.parseTree(data);
    // convert tags to Array
    // data.forEach (record => record.tags = record.tags.trim().split (', '));
    STORAGE.base.data = data;

    resolve(data);
  } else {
    reject();
  }
}

function saveBase(data) {
  STORAGE.base.data = data;
}
function getRawBase(result, resolve) {
  resolve(STORAGE.base.raw);
}


module.exports = () => (
  // PUBLIC FUNCTIONS
  {
    init(config, resolve) {
      STORAGE.config = config;
      BRIEF([
        [config],                   getBase, getBaseTemplate,
        [getBase, getBaseTemplate], parseBase,
        [parseBase],                getRawBase,
      ]).then(resolve);
    },
    gotUserInput(string) {
      debugger;
    },
    think(input, resolve) {
      const text = { input };
      const userInputArr = STORAGE.base.parser.parse(text);
      const result = BRAIN.parseTree(userInputArr);


      saveBase(result);
    },
  });
