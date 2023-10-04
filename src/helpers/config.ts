import config from 'config';
import { TypedResponse } from '../model/express';
import { ServerConfig } from '../model/models';
import messages from '../resources/messages';

/**
 * @returns configuration for server with provided identifier
 */
export function retrieveServerConfiguration(res: TypedResponse<string>, serverId: number) {
  const serversConfiguration = config.get('servers') as ServerConfig[];
  const serverConfiguration = serversConfiguration[serverId];

  // FIXME should not set response here, let calling service do this
  if (!serverConfiguration) {
    res.status(400).send(messages.errors.invalidArg);
  }

  return serverConfiguration;
}
