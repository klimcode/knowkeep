// IMPORTS
  const FILE = require('fs-handy-wraps');
  const Parser = require('parser-template');
  const {LOG, ERR, TIME, MEM} = (require('./console'))({log: true, errors: true});


let VIEW = { // PUBLIC DATA AND FUNCTIONS
  needRestoration: false,

  init,
  showErrorMessage,
  render,
  validate
}
let PARSER;

function init(config, resolve) {
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
    defTemplateText
  );


  function readDefTemplate (path, content) {
    LOG(`created file for Interface Template: ${path}. You may edit it manually.`);
    readTemplate(content);
  }
  function readTemplate(template) {
    PARSER = new Parser(template);
    VIEW.defData = PARSER.parse(template)[0];

    resolve(Object.assign({},VIEW.defData));
  }
}
function render(data, resolve) {
  const pathToInterface = VIEW.config.pathToInterface;
  const dataToDisplay = data || VIEW.data || VIEW.defData;

  VIEW.data = dataToDisplay;
  const viewString = PARSER.stringify(dataToDisplay);

  FILE.write(
    pathToInterface,
    viewString,
    () => resolve && resolve(true)
  );
}
function showErrorMessage(message, resolve) {
  const pathToInterface = VIEW.config.pathToInterface;
  const forcedRestoration = VIEW.needRestoration; // it's false on the first appear
  let mesBroken =
    '\n\n                        INTERFACE IS BROKEN \n'+
    'PLEASE, FIX IT MANUALLY OR IT WILL BE RESTORED WITH POSSIBLE DATA LOSS';
  let msg = message || mesBroken;


  if (forcedRestoration) {
    message = '';
    VIEW.needRestoration = false;
  } else {
    ERR (msg);
    VIEW.needRestoration = true;
  }

  FILE.append (
    pathToInterface,
    msg,
    () => forcedRestoration && render() // rendering of restored interface
  );
}

function validate(input, resolve) {
  const result = PARSER.parse(input)[0];
  if (result) {
    return {result, ok: true}
  } else {
    return {error: 'interface is broken'}
  }
}

module.exports = VIEW;
