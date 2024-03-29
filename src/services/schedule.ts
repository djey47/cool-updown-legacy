import { validateInputParameters } from '../helpers/api';
import { withBackLink } from '../helpers/components';
import logger from '../helpers/logger';
import { generatePage } from '../helpers/page';
import messages from '../resources/messages';

import type { TypedResponse } from '../model/express';
import type { AppState, ServerState } from '../model/models';
import type { ApiRequest } from '../model/api';

export function enable(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  // TODO
  res.send(generatePage('Not implemented yet!'));
}

export function disable(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  // TODO
  res.send(generatePage('Not implemented yet!'));
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

  res.send(generatePage(withBackLink(messages.status.okay, '/', messages.home)));
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

  res.send(generatePage(withBackLink(messages.status.okay, '/', messages.home)));
}
