import config from 'config';
import { NodeSSH } from 'node-ssh';
import wol from 'wake_on_lan';
import logger from '../helpers/logger';
import messages from '../resources/messages';
import { readPrivateKey } from '../helpers/auth';
import { AppState } from '../model/models';
import { TypedResponse } from '../model/express';

const ssh = new NodeSSH();

/**
 * Handles ON request
 */
export function on(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  const currentState = appState;
  const macAddress = config.get('server.macAddress') as string;
  const broadcastAddress = config.get('server.broadcastAddress') as string;
  const options = {
    address: broadcastAddress,
  };
  wol.wake(macAddress, options, (error) => {
    if (error) {
      logger.error(`(on) ${messages.wakeKO} - ${JSON.stringify(error, null, '  ')}`);

      if (res) res.status(500).send(messages.status.kayo);
    } else {
      logger.log('info', `(on) ${messages.wakeOK}`);

      if (!appState.serverStartedAt) {
        currentState.serverStartedAt = new Date(Date.now());
        currentState.serverStoppedAt = undefined;
      }

      if (res) res.send(messages.status.okay);
    }
  });
}

/**
 * Handles OFF request
 */
export async function off(_req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  const currentState = appState;
  const host = config.get('server.hostname') as string;
  const port = config.get('server.sshPort') as number;
  const username = config.get('server.user') as string;
  const password = config.get('server.password') as string;
  const command = config.get('server.offCommand') as string;

  try {
    const privateKey = await readPrivateKey(privateKeyPath);
    await ssh.connect({
      host,
      port,
      username,
      privateKey,
    });

    logger.log('info', messages.sshOK);

    const { stdout, stderr, code } = await ssh.execCommand(command, { stdin: `${password}\n` });
    logger.log('debug', `(off) STDOUT: ${stdout}`);
    logger.log('debug', `(off) STDERR: ${stderr}`);

    if (code !== 0) throw stderr;

    if (!appState.serverStoppedAt) {
      currentState.serverStartedAt = undefined;
      currentState.serverStoppedAt = new Date(Date.now());
    }

    if (res) res.send(messages.status.okay);
  } catch (err) {
    logger.error(`(off) ${messages.sshKO} - ${JSON.stringify(err, null, '  ')}`);

    if (res) res.status(500).send(messages.status.kayo);
  } finally {
    ssh.dispose();
  }
}
