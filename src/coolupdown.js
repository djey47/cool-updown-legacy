const app = require('express')();
const config = require('config');
const messages = require('./resources/messages');
const {
  ping, on, off, enableSchedule, disableSchedule,
} = require('./services');
const {
  createOnJob, createOffJob,
} = require('./helpers/jobs');
const { initBasicAuth } = require('./helpers/auth');

/**
 * @private
 */
const stateWrapper = (callback, state, message) => (req, res) => {
  if (message) console.log(message);
  callback(req, res, state);
};

/**
 * Main entry point for HTTP server
 */
function serverMain() {
  console.log(messages.intro);

  const port = config.get('app.port');
  const isScheduleEnabled = config.get('schedule.enabled');

  // Initial context
  const appState = {
    isScheduleEnabled,
    onJob: createOnJob(config.get('schedule.on'), isScheduleEnabled),
    offJob: createOffJob(config.get('schedule.off'), isScheduleEnabled),
  };

  // Auth support
  const isAuthEnabled = config.get('app.authEnabled');
  const userName = config.get('server.user');
  const password = config.get('server.password');
  initBasicAuth(app, isAuthEnabled, userName, password);

  // Request mapping
  app.get('/', stateWrapper(ping, appState, 'ping'));

  app.get('/on', stateWrapper(on, appState, 'on'));

  app.get('/off', stateWrapper(off, appState, 'off'));

  app.get('/enable', stateWrapper(enableSchedule, appState, 'enableSchedule'));

  app.get('/disable', stateWrapper(disableSchedule, appState, 'disableSchedule'));

  // Starting
  console.log(`${messages.ready} http://localhost:${port}`);
  console.log(messages.exitNotice);

  app.listen(port);
}

process.title = 'cool-updown';
serverMain();
