import { NodeSSH } from 'node-ssh';
import wol, { WakeOptions } from 'wake_on_lan';
import logger from '../helpers/logger';
import messages from '../resources/messages';
import { readPrivateKey } from '../helpers/auth';
import { ApiRequest, AppState } from '../model/models';
import { TypedResponse } from '../model/express';
import { validateInputParameters } from '../helpers/api';
import { retrieveServerConfiguration } from '../helpers/config';
import { generatePage } from '../helpers/page';

const ssh = new NodeSSH();

/**
 * Handles ON request for all servers
 */
export function on(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  // TODO
  res.send(generatePage('Not implemented yet'));
}

/**
 * Handles OFF request for all servers
 */
export function off(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  // TODO
  res.send(generatePage('Not implemented yet'));
}

/**
 * Handles ON request
 */
export function onServer(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  const { serverId } = validateInputParameters(req as ApiRequest, res);
  const serverConfiguration = retrieveServerConfiguration(res, serverId);

  const macAddress = serverConfiguration.network?.macAddress || undefined;
  const broadcastAddress = serverConfiguration.network?.broadcastIpAddress || undefined;
  const options: WakeOptions = {
    address: broadcastAddress,
  };
  wol.wake(macAddress, options, (error) => {
    if (error) {
      logger.error(`(on-server:${serverId}) ${messages.wakeKO} - ${JSON.stringify(error, null, '  ')}`);

      if (res) res.status(500).send(messages.status.kayo);
    } else {
      logger.info(`(on-server:${serverId}) ${messages.wakeOK}`);

      // console.log('onServer', { appState }, appState.servers);

      const serverState = appState.servers[serverId];
      if (!serverState.startedAt) {
        serverState.startedAt = new Date(Date.now());
        serverState.stoppedAt = undefined;
      }

      if (res) res.send(generatePage(messages.status.okay));
    }
  });
}

/**
 * Handles OFF request
 */
export async function offServer(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  const { serverId } = validateInputParameters(req as ApiRequest, res);
  const serverConfiguration = retrieveServerConfiguration(res, serverId);
  
  const host = serverConfiguration.network?.hostname || undefined;
  const port = serverConfiguration.ssh?.port;
  const username = serverConfiguration.ssh?.user;
  const password = serverConfiguration.ssh?.password;
  const command = serverConfiguration.ssh?.offCommand;
  const privateKeyPath = serverConfiguration.ssh?.keyPath || undefined;

  try {
    const privateKey = await readPrivateKey(privateKeyPath);
    await ssh.connect({
      host,
      port,
      username,
      privateKey,
    });

    logger.info(`(off-server:${serverId}) ${messages.sshOK}`);

    const { stdout, stderr, code } = await ssh.execCommand(command, { stdin: `${password}\n` });
    logger.log('debug', `(off-server:${serverId}) STDOUT: ${stdout}`);
    logger.log('debug', `(off-server:${serverId}) STDERR: ${stderr}`);

    if (code !== 0) throw stderr;

    const serverState = appState.servers[serverId];
    if (!serverState.stoppedAt) {
      serverState.startedAt = undefined;
      serverState.stoppedAt = new Date(Date.now());
    }

    if (res) res.send(generatePage(messages.status.okay));
  } catch (err) {
    logger.error(`(off-server:${serverId}) ${messages.sshKO} - ${JSON.stringify(err, null, '  ')}`);

    if (res) res.status(500).send(generatePage(messages.status.kayo));
  } finally {
    ssh.dispose();
  }
}
