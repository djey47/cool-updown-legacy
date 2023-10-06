import childProcess from 'child_process';
import logger from './logger';
import { FeatureStatus } from '../model/models';

/*
 * Mockable system gateway for command line calls
 */

/**
 * ICMP Ping command wrapper
 * @returns Promise
 */
export async function ping(host: string): Promise<FeatureStatus> {
  return new Promise((resolve) => {
    childProcess.exec(`ping -c 2 ${host}`, (err, _stdout, stderr) => {
      const isPingSuccess = !err;
      if (isPingSuccess) {
        logger.log('info', `(ping) ${host}: Alive`);
        resolve(FeatureStatus.OK);
      } else {
        logger.log('info', `(ping) ${host}: Not responding (${stderr})`);
        resolve(FeatureStatus.KO);
      }
    });
  });
}
