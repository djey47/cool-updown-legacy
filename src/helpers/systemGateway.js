/* @flow */

const childProcess = require('child_process');
const logger = require('./logger');

/*
 * Mockable system gateway for command line calls
 */

/**
 * ICMP Ping command wrapper
 * @returns Promise
 */
async function ping(host: string) {
  return new Promise((resolve) => {
    childProcess.exec(`ping -c 2 ${host}`, (err, stdout, stderr) => {
      const isPingSuccess = !err;
      if (isPingSuccess) {
        logger.log('info', `(ping) ${host}: Alive`);
        resolve(true);
      } else {
        logger.log('info', `(ping) ${host}: Not responding (${stderr})`);
        resolve(false);
      }
    });
  });
}

module.exports = {
  ping,
};
