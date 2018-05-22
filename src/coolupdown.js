const express = require('express');
const config = require('config');
const cron = require('cron');
const messages = require('./messages');
const {
  ping, on, off, enableSchedule, disableSchedule,
} = require('./services');

/**
 * @private
 */
const stateWrapper = (callback, state, message) => (req, res) => {
  if (message) console.log(message);
  callback(req, res, state);
};

/**
 * @private
 */
const cronWrapper = (callback, message) => () => {
  if (message) console.log(message);
  callback();
};

/**
 * Main entry point
 */
function main() {
  console.log(messages.intro);

  const port = config.get('app.port');
  const isScheduleEnabled = config.get('schedule.enabled');

  // Jobs
  // TODO build proper cron schedule according to settings
  const { CronJob } = cron;
  const onJob = new CronJob('* * * * * *', cronWrapper(on, messages.onCron));
  const offJob = new CronJob('* * * * * *', cronWrapper(off, messages.offCron));
  if (isScheduleEnabled) {
    onJob.start();
    offJob.start();
  }

  // Initial context
  const appState = {
    isScheduleEnabled,
    onJob,
    offJob,
  };

  const app = express();

  app.get('/', stateWrapper(ping, appState, 'ping'));

  app.get('/on', stateWrapper(on, appState, 'on'));

  app.get('/off', stateWrapper(off, appState, 'off'));

  app.get('/enable', stateWrapper(enableSchedule, appState, 'enableSchedule'));

  app.get('/disable', stateWrapper(disableSchedule, appState, 'disableSchedule'));

  console.log(`${messages.ready} http://localhost:${port}`);
  console.log(messages.exitNotice);

  app.listen(port);
}

main();
