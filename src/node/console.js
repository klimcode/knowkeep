module.exports = function (settings) {
  return {
    LOG(msg, arg) {
      if (settings.log) {
        console.log ('\x1b[1m%s\x1b[0m', msg);
        arg && console.log (...[...arguments].slice(1));
      } 
    },
    ERR(msg, arg) {
      if (settings.errors) {
        console.error ('\x1b[31m%s\x1b[0m', msg);
        arg && console.error (...[...arguments].slice(1));
      }
    },
    TIME(start) {
      if (!start) return process.hrtime();
      
      const end = process.hrtime(start);
      const diff = end[0]*1000000 + end[1]/1000;
      return Math.round(diff)/1000;
    },
    MEM() {
      return process.memoryUsage().rss/1000000; // Megabytes
    }
  }
}
