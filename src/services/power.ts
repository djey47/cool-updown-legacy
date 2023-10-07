import { NodeSSH, SSHExecCommandOptions } from 'node-ssh';
import wol, { WakeOptions } from 'wake_on_lan';
import logger from '../helpers/logger';
import messages from '../resources/messages';
import { validateInputParameters } from '../helpers/api';
import { retrieveServerConfiguration } from '../helpers/config';
import { generatePage } from '../helpers/page';
import { withBackLink } from '../helpers/components';
import { getSSHParameters } from '../helpers/ssh';

import { AppState, FeatureStatus } from '../model/models';
import type { TypedResponse } from '../model/express';
import type { ApiRequest } from '../model/api';

const ssh = new NodeSSH();

const DEFAULT_SSH_OFF_COMMAND = 'sudo -S shutdown -h now';

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
  const serverState = appState.servers[serverId];

  if (serverState.lastPingStatus === FeatureStatus.OK) {
    logger.info(`(on-server:${serverId})) no operation will be processed as the last ping status is OK`);
    if (res) res.send(generatePage(withBackLink(messages.status.noop, '/', messages.home)));
    return;
  }

  const serverConfiguration = retrieveServerConfiguration(res, serverId);

  const macAddress = serverConfiguration.network?.macAddress || undefined;
  const broadcastAddress = serverConfiguration.network?.broadcastIpAddress || undefined;
  const options: WakeOptions = {
    address: broadcastAddress,
  };
  wol.wake(macAddress, options, (error) => {
    if (error) {
      logger.error(`(on-server:${serverId}) ${messages.wakeKO} - ${JSON.stringify(error, null, '  ')}`);

      if (res) res.status(500).send(withBackLink(messages.status.kayo, '/', messages.home));
    } else {
      logger.info(`(on-server:${serverId}) ${messages.wakeOK}`);

      // console.log('onServer', { appState }, appState.servers);

      serverState.startedAt = new Date(Date.now());

      if (res) res.send(generatePage(withBackLink(messages.status.okay, '/', messages.home)));
    }
  });
}

/**
 * Handles OFF request
 */
export async function offServer(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  const { serverId } = validateInputParameters(req as ApiRequest, res);
  const serverState = appState.servers[serverId];

  if (serverState.lastPingStatus === FeatureStatus.KO) {
    logger.info(`(off-server:${serverId})) no operation will be processed as the last ping status is KO`);
    if (res) res.send(generatePage(withBackLink(messages.status.noop, '/', messages.home)));
  }

  const serverConfiguration = retrieveServerConfiguration(res, serverId);
  const { ssh: sshConfiguration } = serverConfiguration;

  try {
    const sshClientConfig = await getSSHParameters(serverConfiguration);
    await ssh.connect(sshClientConfig);

    logger.info(`(off-server:${serverId}) ${messages.sshOK}`);

    const commandOptions: SSHExecCommandOptions = {

    };
    const password = sshConfiguration?.password;
    if (password !== undefined) {
      commandOptions.stdin = `${password}\n`; 
    }

    const command = sshConfiguration?.offCommand || DEFAULT_SSH_OFF_COMMAND;
    const { stdout, stderr, code } = await ssh.execCommand(command, commandOptions);

    logger.debug(`(off-server:${serverId}) STDOUT: ${stdout}`);
    logger.debug(`(off-server:${serverId}) STDERR: ${stderr}`);
    logger.debug(`(off-server:${serverId}) shutdown command exit code: ${code}`);

    if (code !== 0) throw stderr;

    serverState.stoppedAt = new Date(Date.now());

    if (res) res.send(generatePage(withBackLink(messages.status.okay, '/', messages.home)));
  } catch (err) {
    logger.error(`(off-server:${serverId}) ${messages.sshKO} - ${JSON.stringify(err, null, '  ')}`);

    if (res) res.status(500).send(generatePage(withBackLink(messages.status.kayo, '/', messages.home)));
  } finally {
    ssh.dispose();
  }
}
