const express = require('express');
const config = require('config');
const messages = require('./messages');
const {
  ping, on, off, enableSchedule, disableSchedule,
} = require('./services');
const {
  createOnJob, createOffJob,
} = require('./jobs');

/**
 * @private
 */
const stateWrapper = (callback, state, message) => (req, res) => {
  if (message) console.log(message);
  callback(req, res, state);
};

/**
 * Main entry point
 */
function main() {
  console.log(messages.intro);

  const port = config.get('app.port');
  const isScheduleEnabled = config.get('schedule.enabled');

  // Initial context
  const appState = {
    isScheduleEnabled,
    onJob: createOnJob(config.get('schedule.on'), isScheduleEnabled),
    offJob: createOffJob(config.get('schedule.off'), isScheduleEnabled),
  };

  const app = express();

  // TODO Basic auth

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
