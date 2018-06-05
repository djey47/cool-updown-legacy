/* @flow */

import type { Job } from 'cron';
import type { AppState, Schedule } from '../constants/types';

const cron = require('cron');
const {
  on, off,
} = require('../services');
const logger = require('./logger');

const { CronJob } = cron;

/**
 * @private
 */
const cronWrapper = (callback: Function, action: string) => () => {
  if (action) logger.log('info', `=>(...cron:${action}...)`);
  callback();
};

/**
 * @private
 */
function toCronSyntax({ at }: Schedule) {
  if (!at) return '* * * * * *';
  const [hr, mn] = at.split(':');
  return `00 ${mn || '00'} ${hr || '00'} * * *`;
}

/**
 * @private
 */
function createJobAndStart(
  callBack: Function,
  action: string,
  schedule: Schedule,
  isEnabled: boolean,
  appState: AppState,
): Job {
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
function createOnJob(schedule: Schedule, isEnabled: boolean, appState: AppState): Job {
  return createJobAndStart(on, 'on', schedule, isEnabled, appState);
}

/**
 * Creates OFF job and starts it if enabled
 */
function createOffJob(schedule: Schedule, isEnabled: boolean, appState: AppState): Job {
  return createJobAndStart(off, 'off', schedule, isEnabled, appState);
}

module.exports = {
  createOnJob,
  createOffJob,
  toCronSyntax, // For testing
};
