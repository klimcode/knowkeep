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
  },
  parseTree (inputArray, errorCallback) {
    let data = getClearData (inputArray); // remove whitespaces + get levels
    data.forEach ((elem, id, arr) => { // each element gets a parent
      if (!elem.level) {
        elem.parents = elem.parentIds = [];
        return;
      }
      for (var i=id; arr[i].level >= elem.level; i--);
      elem.parents = [arr[i].name];
      elem.parentIds = [i];
    });
    data = mergeDuplicates (data);

    return data;


    function getClearData (inputArray) {
      const firstRecord = { 
        name: inputArray[0].name,
        text: UTIL.superTrim(inputArray[0].text), 
        level: 0
      }
      let result = [firstRecord];
  
      const tabWidth = UTIL.getTabWidth (inputArray);
  
      for (let i=1; i<inputArray.length; i++) {
        const recordName = inputArray[i].name;
        const prevLevel = result[i-1].level;
        const indents = UTIL.getIndents (recordName, tabWidth);
  
        let record = {
          name: recordName.trim(),
          text: UTIL.superTrim (inputArray[i].text)
        }
        if (indents > prevLevel) record.level = prevLevel + 1;
        else record.level = indents;
  
        result.push (record);
      };

      return result;
    }
    function mergeDuplicates (inputArray) {
      let result = [inputArray[0]];

      for (let i=1; i<inputArray.length; i++) { // searching clones
        let elem = inputArray[i];
        let cloneIndex = result.findIndex (cand => cand.name === elem.name);
        if (cloneIndex === -1) result.push (elem);

        else { // a clone is found
          let circularId = checkParentRoutes (elem.name, elem.parentIds, inputArray);
          if (circularId != void 0) {
            errorCallback && errorCallback ({code: 'circular', where: elem.name});
          } else {
            merge (result[cloneIndex], elem);
          }
        }
      }

      return result;


      function merge (record, clone) {
        record.parents.push (clone.parents[0]);
        UTIL.concatUniqText (record.text, clone.text);
      }
      function checkParentRoutes (checkingName, parentIds, array) { // recursive
        if (!parentIds) return;
        for (let i=0; i<parentIds.length; i++) {
          let parentId = parentIds[i];
          let parent = array[parentId];

          if (parent.name === checkingName) return parentId;
          else {
            let circularId = checkParentRoutes (checkingName, parent.parentIds, array);
            if (circularId !== void 0) return circularId;
          } 
        }
      }
    }
  }
}
