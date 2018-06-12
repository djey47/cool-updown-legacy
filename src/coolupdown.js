const app = require('express')();
const config = require('config');
const messages = require('./resources/messages');
const {
  ping, on, off, enableSchedule, disableSchedule, logs,
} = require('./services');
const {
  createOnJob, createOffJob,
} = require('./helpers/jobs');
const { initBasicAuth } = require('./helpers/auth');
const logger = require('./helpers/logger');

/**
 * @private
 */
const stateWrapper = (callback, state, message) => (req, res) => {
  if (message) logger.log('info', `=>(...${message}...)`);
  callback(req, res, state);
};

/**
 * Main entry point for HTTP server
 */
function serverMain() {
  logger.log('info', messages.intro);

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

  app.get('/logs', stateWrapper(logs, appState, 'logs'));

  app.get('/on', stateWrapper(on, appState, 'on'));

  app.get('/off', stateWrapper(off, appState, 'off'));

  app.get('/enable', stateWrapper(enableSchedule, appState, 'enable'));

  app.get('/disable', stateWrapper(disableSchedule, appState, 'disable'));

  // Starting
  logger.log('info', `${messages.ready} http://localhost:${port}`);
  logger.log('info', messages.exitNotice);

  return app.listen(port);
}

process.title = 'cool-updown';

const server = serverMain();

// Exits properly on SIGINT
process.on('SIGINT', () => {
  logger.log('warn', messages.interrupt);

  server.close(() => {
    logger.log('info', messages.outro);

    process.exit(0);
  });
});
