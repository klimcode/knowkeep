// IMPORTS
const BRIEF = require('brief-async');
const FILE = require('fs-handy-wraps');
const Parser = require('parser-template');
const BRAIN = require('../knowkeep');
const { LOG, ERR } = (require('./console'))({ log: true, errors: true });

const STORAGE = {
  baseType: 'flat',
  needBaseParsing: false,
  base: {},
  cachedInput: '',
};


// INTERNAL FUNCTIONS
function getBase(config, resolve, reject) {
  const { pathToBase } = config;
  const baseType = pathToBase.endsWith('.flat')
    ? 'flat'
    : 'tree';
  STORAGE.baseType = baseType;

  LOG(`Database file: ${pathToBase}`);
  FILE.readOrMake(
    pathToBase,
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
    if ((content !== '') && (baseType === 'flat')) {
      STORAGE.needBaseParsing = true;
    }

    resolve(content);
  }
  function errHandler(err) {
    ERR(`Can not write to file: ${config.pathToBase}`);
    reject(err);
  }
}
function makeFlatParser(config, resolve, reject) {
  const { pathToFlatTemplate } = config;

  const defTemplateContent =
  '<><name>\n' +
  '<><tags>\n' +
  '<m><text>\n' +
  '~~~\n';


  LOG(`Flat template: ${pathToFlatTemplate}`);
  FILE.readOrMake(
    pathToFlatTemplate,
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
    STORAGE.flatParser = parser;
    resolve(parser);
  }
  function errHandler(err) {
    ERR(`Can not write to file: ${pathToFlatTemplate}`);
    reject(err);
  }
}
function makeTreeParser(config, resolve, reject) {
  const { pathToTreeTemplate } = config;

  const defTemplateContent =
  '<><name>\n' +
  '<m><text>\n' +
  '\n';


  LOG(`Tree template: ${pathToTreeTemplate}`);
  FILE.readOrMake(
    pathToTreeTemplate,
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
    STORAGE.treeParser = parser;
    resolve(parser);
  }
  function errHandler(err) {
    ERR(`Can not write to file: ${pathToTreeTemplate}`);
    reject(err);
  }
}
function parseBase(args, resolve) {
  const dataRaw = args[0];
  let data = '';

  if (STORAGE.needBaseParsing) {
    const parser = args[1];

    data = parser.parse(dataRaw);

    // if Parser returned only one Record object -> enforce it to be an array.
    data = data instanceof Array ? data : [data];
    data = data.filter(record => record.text.trim()); // remove empty records
    data.map((record) => { // convert tags to Array
      const res = record;
      res.tags = record.tags.trim().split(', ');
      return res;
    });
    data = BRAIN.makeTree(data);
  } else data = dataRaw;

  STORAGE.base.data = data;
  resolve(data);
}
function finishInit(data, resolve) {
  const result = {
    data,
    dataType: STORAGE.baseType,
  };
  resolve(result);
}


function executeCommand(view) {
  const { text, command } = view;
  let result = view;


  if (!command) saveBase(text);
  else {
    const userInputArr = STORAGE.treeParser.parse(text);
    result = BRAIN.convertToTree(userInputArr);
  }

  return result;
}
function saveBase(data) {
  STORAGE.base.data = data;

  const path = STORAGE.config.pathToBase;
  FILE.write(
    path,
    data,
  );
}


module.exports = () => ({
  // PUBLIC FUNCTIONS
  init(config, resolve) {
    STORAGE.config = config;
    BRIEF([
      [config],                                   getBase, makeFlatParser, makeTreeParser,
      [getBase, makeFlatParser, makeTreeParser],  parseBase,
      [parseBase],                                finishInit,
    ]).then(resolve);
  },
  gotUserInput(view) {
    const { text, command } = view;
    const isChangedText = text !== STORAGE.cachedInput;
    const result = isChangedText
      ? executeCommand(view)
      : view;

    if (isChangedText) STORAGE.cachedInput = text;
    result.needRender = command || false;

    return result;
  },
});
