import config from 'config';
import { TypedResponse } from "../model/express";
import { ServerConfig } from '../model/models';
import messages from '../resources/messages';

/**
 * 
 * @param res 
 * @param serverId 
 * @returns 
 */
export function retrieveServerConfiguration(res: TypedResponse<string>, serverId: string) {
  const serversConfiguration = config.get('servers');
  const serverConfiguration = serversConfiguration[serverId] as ServerConfig;

  if (!serverConfiguration) {
    res.status(400).send(messages.errors.invalidArg);
  }

  return serverConfiguration;
}
