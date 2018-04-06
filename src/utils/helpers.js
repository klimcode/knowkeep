// This module can be used in Node.js and a browser.
// No host-specified Objects must be used here.
module.exports = {
    removeDuplicates (arr) {
        return arr.filter ((el, pos, a) => (a.indexOf(el) == pos) && el );
    },
    prettifyList (input) { // "a, b ,,b   ,,  c,d,d" ==> [a, b, c, d]
        let tags = input
            .split (',')
            .map (s => s.trim())
            .filter (s => s != '');

        return this.removeDuplicates (tags);
    },
    isEqual (str1, str2) {
        return str1.toLowerCase().trim() === str2.toLowerCase().trim();
    },
    swap (arr, a, b) {
        let temp = arr[a];
        arr[a] = arr[b];
        arr[b] = temp;
        return arr;
    },



    getTabWidth (input) {
        let tabWidth = 0;
        for (let i=0; i<input.length; i++) {
            const name = input[i].name;
            if (name[0] !== ' ') continue;
            
            while (name[tabWidth++] === ' ');
            
            return tabWidth - 1;
        }
    },
    getIndents (string, tabWidth) {
        let indents = 0;
        for (let i=0; i<string.length; i+=tabWidth) {
            if (string[i] === ' ') indents++;
            else return indents;
        }
    },
    superTrim (string) {
        return string
            .split ('\n')
            .map (s => s.trim())
            .join ('\n');
    },
    concatUniqText (acc, addition) {
        if (!acc) return addition;
        if (!addition) return acc;

        if (addition.startsWith (acc))
            return addition;

        return acc +'\n'+ addition;
    },
}
