import childProcess from 'child_process';
import logger from './logger';

/*
 * Mockable system gateway for command line calls
 */

/**
 * ICMP Ping command wrapper
 * @returns Promise
 */
export async function ping(host: string): Promise<boolean> {
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
