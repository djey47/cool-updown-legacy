import { validateInputParameters } from '../helpers/api';
import logger from '../helpers/logger';
import { TypedResponse } from '../model/express';
import { ApiRequest, AppState, ServerState } from '../model/models';
import messages from '../resources/messages';

export function enable(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  // TODO
  res.send('Not implemented yet!');
}

export function disable(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  // TODO
  res.send('Not implemented yet!');
}

/**
 * Handles ENABLE SCHEDULE request for single server
 */
export function enableServer(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  const { serverId } = validateInputParameters(req as ApiRequest, res);

  const serverState: ServerState = appState.servers[serverId];
  serverState.isScheduleEnabled = true;
  serverState.onJob.start();
  serverState.offJob.start();

  logger.info(`(enable-server:${serverId}) schedule enabled`);

  res.send(messages.status.okay);
}

/**
  * Handles DISABLE SCHEDULE request for single server
  */
export function disableServer(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  const { serverId } = validateInputParameters(req as ApiRequest, res);

  const serverState: ServerState = appState.servers[serverId];
  serverState.isScheduleEnabled = false;
  serverState.onJob.stop();
  serverState.offJob.stop();

  logger.info(`(disable-server:${serverId}) schedule disabled`);

  res.send(messages.status.okay);
}
