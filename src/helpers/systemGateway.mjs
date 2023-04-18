import childProcess from 'child_process';
import logger from './logger.mjs';

/*
 * Mockable system gateway for command line calls
 */

/**
 * ICMP Ping command wrapper
 * @returns Promise
 */
// eslint-disable-next-line import/prefer-default-export
export async function ping(host) {
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
