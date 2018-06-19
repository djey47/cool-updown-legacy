const cron = require('cron');
const {
  on, off,
} = require('../services');
const logger = require('./logger');

const { CronJob } = cron;

/**
 * @private
 */
const cronWrapper = (callback, action) => () => {
  if (action) logger.log('info', `=>(...cron:${action}...)`);
  callback();
};

/**
 * @private
 */
function toCronSyntax({ at }) {
  if (!at) return '* * * * * *';
  const [hr, mn] = at.split(':');
  return `00 ${mn || '00'} ${hr || '00'} * * *`;
}

/**
 * @private
 */
function createJobAndStart(callBack, action, schedule, isEnabled, appState) {
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
function createOnJob(schedule, isEnabled, appState) {
  return createJobAndStart(on, 'on', schedule, isEnabled, appState);
}

/**
 * Creates OFF job and starts it if enabled
 */
function createOffJob(schedule, isEnabled, appState) {
  return createJobAndStart(off, 'off', schedule, isEnabled, appState);
}

module.exports = {
  createOnJob,
  createOffJob,
  toCronSyntax, // For testing
};
