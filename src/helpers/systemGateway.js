const childProcess = require('child_process');

/*
 * Mockable system gateway for command line calls
 */

/**
 * Ping command wrapper
 */
function ping(host, callback) {
  childProcess.exec(`ping -c 2 ${host}`, callback);
}

module.exports = {
  ping,
};
