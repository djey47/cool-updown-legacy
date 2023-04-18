import config from 'config';
import express from 'express';
import logs from './services/logs.mjs';
import ping from './services/ping.mjs';
import { on, off } from './services/power.mjs';
import messages from './resources/messages.mjs';
import { enable, disable } from './services/schedule.mjs';
import { createOffJob, createOnJob } from './helpers/jobs.mjs';
import { initBasicAuth } from './helpers/auth.mjs';
import logger from './helpers/logger.mjs';

const app = express();

/**
 * @private
 */
const stateWrapper = (callback, state, message) => (req, res) => {
  if (message) logger.log('info', `=>(...${message}...)`);
  callback(req, res, state);
};

/**
 * @private
 */
const initAppState = () => {
  const isScheduleEnabled = config.get('schedule.enabled');
  const appState = {
    isScheduleEnabled,
    startedAt: new Date(Date.now()),
  };
  appState.onJob = createOnJob(config.get('schedule.on'), isScheduleEnabled, appState);
  appState.offJob = createOffJob(config.get('schedule.off'), isScheduleEnabled, appState);
  return appState;
};

/**
 * @private
 */
const initAuth = () => {
  const isAuthEnabled = config.get('app.authEnabled');
  const userName = config.get('server.user');
  const password = config.get('server.password');
  initBasicAuth(app, isAuthEnabled, userName, password);
};

/**
 * Main entry point for HTTP server
 */
function serverMain() {
  logger.log('info', messages.intro);

  const port = config.get('app.port');

  // Initial context
  const appState = initAppState();

  // Authentication support
  initAuth();

  // Request mapping
  app.get('/', stateWrapper(ping, appState, 'ping'));

  app.get('/logs', stateWrapper(logs, appState, 'logs'));

  app.get('/on', stateWrapper(on, appState, 'on'));

  app.get('/off', stateWrapper(off, appState, 'off'));

  app.get('/enable', stateWrapper(enable, appState, 'enable'));

  app.get('/disable', stateWrapper(disable, appState, 'disable'));

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
