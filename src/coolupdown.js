/* @flow */

import type { $Request, $Response } from 'express';
import type { AppState } from './constants/types';

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
const stateWrapper = (
  callback: Function,
  state: AppState,
  message: string,
) => (req: $Request, res: $Response) => {
  if (message) logger.log('info', `=>(...${message}...)`);
  callback(req, res, state);
};

/**
 * @private
 */
const initAppState = () => {
  const isScheduleEnabled = config.get('schedule.enabled');
  const appState: AppState = {
    isScheduleEnabled,
    startedAt: new Date(Date.now()),
    onJob: undefined,
    offJob: undefined,
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
function serverMain(): any {
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
