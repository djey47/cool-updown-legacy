const cron = require('cron');
const {
  on, off,
} = require('./services');
const messages = require('./messages');

const { CronJob } = cron;

/**
 * @private
 */
const cronWrapper = (callback, message) => () => {
  if (message) console.log(message);
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
function createJobAndStart(callBack, message, schedule, isEnabled) {
  const job = new CronJob(toCronSyntax(schedule), cronWrapper(callBack, message));
  if (isEnabled) job.start();
  return job;
}

/**
 * Creates ON job and starts it if enabled
 */
function createOnJob(schedule, isEnabled) {
  return createJobAndStart(on, messages.onCron, schedule, isEnabled);
}

/**
 * Creates OFF job and starts it if enabled
 */
function createOffJob(schedule, isEnabled) {
  return createJobAndStart(off, messages.offCron, schedule, isEnabled);
}

module.exports = {
  createOnJob,
  createOffJob,
  toCronSyntax, // For testing
};
