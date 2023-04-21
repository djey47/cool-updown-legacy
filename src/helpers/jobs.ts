import cron from 'cron';
import { on, off } from '../services/power';
import logger from './logger';
import { AppState, HandlerCallback, Schedule } from '../model/models';

const { CronJob } = cron;

/**
 * @private
 */
const cronWrapper = (callback: () => void, action: string) => () => {
  logger.log('info', `=>(...cron:${action}...)`);
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
function createJobAndStart(callBack: HandlerCallback, action: string, schedule: Schedule, isEnabled: boolean, appState: AppState) {
  if (!appState) throw new Error('Error: createJobAndStart: appState argument is not mandatory');

  const enhancedCallBack = () => {
    callBack(undefined, undefined, appState);
  };
  const job = new CronJob(toCronSyntax(schedule), cronWrapper(enhancedCallBack, action));
  if (isEnabled) job.start();
  return job;
}

/**
 * Creates ON job and starts it if enabled
 */
export function createOnJob(schedule: Schedule, isEnabled: boolean, appState: AppState) {
  return createJobAndStart(on, 'on', schedule, isEnabled, appState);
}

/**
 * Creates OFF job and starts it if enabled
 */
export function createOffJob(schedule: Schedule, isEnabled: boolean, appState: AppState) {
  return createJobAndStart(off, 'off', schedule, isEnabled, appState);
}
