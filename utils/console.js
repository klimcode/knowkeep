module.exports = function (settings) {

    return {
        LOG (msg) {
            settings.log && console.log ('\x1b[2m%s\x1b[0m', msg);
        },
        ERR (msg) {
            console.error ('\x1b[31m%s\x1b[0m', msg);
        },
    }
}
