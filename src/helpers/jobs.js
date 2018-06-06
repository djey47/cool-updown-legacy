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
function createJobAndStart(callBack, action, schedule, isEnabled) {
  const job = new CronJob(toCronSyntax(schedule), cronWrapper(callBack, action));
  if (isEnabled) job.start();
  return job;
}

/**
 * Creates ON job and starts it if enabled
 */
function createOnJob(schedule, isEnabled) {
  return createJobAndStart(on, 'on', schedule, isEnabled);
}

/**
 * Creates OFF job and starts it if enabled
 */
function createOffJob(schedule, isEnabled) {
  return createJobAndStart(off, 'off', schedule, isEnabled);
}

module.exports = {
  createOnJob,
  createOffJob,
  toCronSyntax, // For testing
};
