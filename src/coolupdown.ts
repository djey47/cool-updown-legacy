import config from 'config';
import express from 'express';
import logs from './services/logs';
import ping from './services/ping';
import { on, off, onServer, offServer } from './services/power';
import messages from './resources/messages';
import { enable, disable } from './services/schedule';
import { initBasicAuth } from './helpers/auth';
import logger from './helpers/logger';
import { AppState, ServerConfig, ServerState } from './model/models';

const app = express();

/**
 * @private
 */
const stateWrapper = (callback, state: AppState, message: string) => (req, res) => {
  if (message) logger.log('info', `=>(...${message}...)`);
  callback(req, res, state);
};

/**
 * @private
 */
const initAppState = () => {
  // const isScheduleEnabled = config.get('schedule.enabled') as boolean;
  const serversConfig = config.get('servers') as ServerConfig[];
  const serversState: ServerState[] = serversConfig.map(() => ({}));
  const appState = {
    isScheduleEnabled: false, // TODO implement global scheduling switch
    // onJob: createOnJob(config.get('schedule.on'), isScheduleEnabled, this),
    // offJob: createOffJob(config.get('schedule.off'), isScheduleEnabled, this),
    startedAt: new Date(Date.now()),
    servers: serversState,
  };
  return appState;
};

/**
 * @private
 */
const initAuth = () => {
  const isAuthEnabled = config.get('app.authEnabled') as boolean;
  const userName = config.get('app.user') as string;
  const password = config.get('app.password') as string;
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
  
  app.get('/:serverId/on', stateWrapper(onServer, appState, 'on-server'));

  app.get('/:serverId/off', stateWrapper(offServer, appState, 'off-server'));
  
  app.get('/on', stateWrapper(on, appState, 'on-all'));

  app.get('/off', stateWrapper(off, appState, 'off-server'));

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
