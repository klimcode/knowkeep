const UTIL = (require('./utils/helpers'));


module.exports = {
  convertToTree(inputArray, errorCallback) {
    const arraySeparated = inputArray.map((el) => {
      const splitted = el.text.split('\n');
      const name = splitted[0] || (splitted.shift(), splitted[0]) || '';
      const text = splitted.slice(1).join('\n');
      return { name, text };
    });
    let data = getClearData(arraySeparated); // remove whitespaces + get levels


    data.forEach((elem, id, arr) => { // each element gets a parent. Magic code
      if (!elem.level) {
        elem.parents = elem.parentIds = [];
        return;
      }
      for (var i = id; arr[i].level >= elem.level; i--); // search for the parent
      elem.parents = [arr[i].name];
      elem.parentIds = [i];
    });
    data = mergeDuplicates(data);

    return data;


    function getClearData(inputArray) {
      const tabWidth = UTIL.getTabWidth(inputArray);

      const firstRecord = {
        name: inputArray[0].name,
        text: inputArray[0].text,
        level: 0,
      };
      const result = [firstRecord];


      for (let i = 1; i < inputArray.length; i++) {
        const recordName = inputArray[i].name;
        const recordText = inputArray[i].text;
        const prevLevel = result[i - 1].level;
        const indents = UTIL.getIndents(recordName, tabWidth);

        const recordLevel = indents > prevLevel
          ? prevLevel + 1
          : indents;
        const record = {
          name: recordName.trim(),
          text: UTIL.superTrim(recordText, recordLevel, tabWidth),
          level: recordLevel,
        };

        result.push(record);
      }

      return result;
    }
    function mergeDuplicates(inputArray) {
      let result = [inputArray[0]];

      for (let i = 1; i < inputArray.length; i++) { // searching clones
        const elem = inputArray[i];
        const cloneIndex = result.findIndex(cand => cand.name === elem.name);
        if (cloneIndex === -1) result.push(elem);

        else { // a clone is found
          const circularId = checkParentRoutes(elem.name, elem.parentIds, inputArray);
          if (circularId != undefined) {
            errorCallback && errorCallback ({code: 'circular', where: elem.name});
          } else {
            merge(result[cloneIndex], elem);
          }
        }
      }

      return result;


      function merge(record, clone) {
        record.parents.push(clone.parents[0]);
        UTIL.concatUniqText(record.text, clone.text);
      }
      function checkParentRoutes(checkingName, parentIds, array) { // recursive
        if (!parentIds) return;
        for (let i = 0; i < parentIds.length; i++) {
          const parentId = parentIds[i];
          const parent = array[parentId];

          if (parent.name === checkingName) return parentId;
          else {
            let circularId = checkParentRoutes(checkingName, parent.parentIds, array);
            if (circularId !== void 0) return circularId;
          }
        }
      }
    }
  },
  makeTree(inputArray) {
    // Building tree from flat array will be ready in future...
    return 'ha-ha';
  },
}
