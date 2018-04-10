// IMPORTS
const FILE = require('fs-handy-wraps');
const Parser = require('parser-template');
const { LOG, ERR } = (require('./console'))({ log: true, errors: true });


const VIEW = { // PUBLIC DATA AND FUNCTIONS
  needRestoration: false,

  init,
  showErrorMessage,
  render,
  validate,
};
let PARSER;

function init(config, resolve, reject) {
  VIEW.config = config;
  const pathToTemplate = config.pathToInterfaceTemplate;
  const defTemplateText =
  '<m><text>' +
  '\n================================ commands ====================================\n' +
  '<m>add<command>\n';


  LOG(`Interface template: ${pathToTemplate}`);
  FILE.readOrMake(
    pathToTemplate,
    readTemplate,
    readDefTemplate,
    defTemplateText,
    errHandler,
  );


  function readDefTemplate(path, content) {
    LOG(`created file for Interface Template: ${path}. You may edit it manually.`);
    readTemplate(content);
  }
  function readTemplate(template) {
    PARSER = new Parser(template);
    [VIEW.defData] = PARSER.parse(template);

    resolve(Object.assign({}, VIEW.defData));
  }
  function errHandler(err) {
    ERR(`Can not write to file: ${pathToTemplate}`);
    reject(err);
  }
}
function render(data, resolve) {
  const { pathToInterface } = VIEW.config;
  const dataToDisplay = data || VIEW.data || VIEW.defData;

  VIEW.data = dataToDisplay;
  const viewString = PARSER.stringify(dataToDisplay);

  FILE.write(
    pathToInterface,
    viewString,
    () => resolve && resolve(true),
  );
}
function showErrorMessage(message) {
  const { pathToInterface } = VIEW.config;
  const forcedRestoration = VIEW.needRestoration; // it's false on the first appear
  const mesBroken =
    '\n\n                        INTERFACE IS BROKEN \n' +
    'PLEASE, FIX IT MANUALLY OR IT WILL BE RESTORED WITH POSSIBLE DATA LOSS';
  let msg = message || mesBroken;


  if (forcedRestoration) {
    msg = '';
    VIEW.needRestoration = false;
  } else {
    ERR(msg);
    VIEW.needRestoration = true;
  }

  FILE.append(
    pathToInterface,
    msg,
    () => forcedRestoration && render(), // rendering of restored interface
  );
}

function validate(input) {
  const data = PARSER.parse(input)[0];
  const result = data
    ? { isOk: true, data }
    : { error: 'interface is broken' };
  return result;
}

module.exports = VIEW;
