import cron from 'cron';
import { onServer, offServer } from '../services/power';
import logger from './logger';
import { ApiRequest, AppState, HandlerCallback, Schedule } from '../model/models';

const { CronJob } = cron;

/**
 * @private
 */
const cronWrapper = (callback: () => void, message: string) => () => {
  logger.log('info', `=>(...cron:${message}...)`);
  callback();
};

/**
 * @private exported for testing purposes
 */
export function toCronSyntax({ at }: Schedule) {
  if (!at) return '* * * * * *';
  const [hr, mn] = at.split(':');
  return `00 ${mn || '00'} ${hr || '00'} * * *`;
}

/**
 * @private
 */
function createJobAndStart(callBack: HandlerCallback, action: string, serverId: string, schedule: Schedule, isEnabled: boolean, appState: AppState) {
  if (!appState) throw new Error('Error: createJobAndStart: appState argument is not mandatory');

  // console.log('jobs::createJobAndStart', { appState });

  const enhancedCallBack = () => {
    const request: ApiRequest = {
      params: {
        serverId,
      }
    } 
    callBack(request, undefined, appState);
  };
  const message = `${action}:${serverId}`;
  const job = new CronJob(toCronSyntax(schedule), cronWrapper(enhancedCallBack, message));
  if (isEnabled) {
    job.start();
  }
    
  return job;
}

/**
 * Creates ON job and starts it if enabled
 */
export function createOnJob(serverId:string, schedule: Schedule, isEnabled: boolean, appState: AppState) {
  return createJobAndStart(onServer, 'on-server', serverId, schedule, isEnabled, appState);
}

/**
 * Creates OFF job and starts it if enabled
 */
export function createOffJob(serverId: string, schedule: Schedule, isEnabled: boolean, appState: AppState) {
  return createJobAndStart(offServer, 'off-server', serverId, schedule, isEnabled, appState);
}
