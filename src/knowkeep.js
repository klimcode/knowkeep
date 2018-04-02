const UTIL = (require('./utils/helpers'));


module.exports = {
  think(base, command, params) {
    const commandsList = {
      '': empty,
      'add': add,
      'mul': addMultiple,
      'adopt': adopt,
      'mix': mixRecords,
      'get': getRecord,
      'edit': edit,
      'del': deleteRecord,
      'ren': rename,
      'clr': clear,
      'last': lastRecord,
      'tree': tree,
      'load': loadBase,
      'exit': exit,
    };
    let error = false;

    try {
      commandsList[command](params);
    } catch (details) {
      error = {
        text: 'OMG ERROR',
        details
      }
    }

    return { base, view: interface, error };
  }
}
