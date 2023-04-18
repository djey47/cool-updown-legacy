import config from 'config';
import { NodeSSH } from 'node-ssh';
import wol from 'wake_on_lan';
import logger from '../helpers/logger';
import messages from '../resources/messages';
import { readPrivateKey } from '../helpers/auth';

const ssh = new NodeSSH();

/**
 * Handles ON request
 */
export function on(req, res, appState) {
  const currentState = appState;
  const macAddress = config.get('server.macAddress');
  const broadcastAddress = config.get('server.broadcastAddress');
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
export async function off(_req, res, appState) {
  const currentState = appState;
  const host = config.get('server.hostname');
  const port = config.get('server.sshPort');
  const username = config.get('server.user');
  const password = config.get('server.password');
  const command = config.get('server.offCommand');

  try {
    const privateKey = await readPrivateKey();
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
