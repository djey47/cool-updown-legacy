const NodeSSH = require('node-ssh');
const wol = require('wake_on_lan');
const config = require('config');
const fs = require('fs');
const util = require('util');
const loCloneDeep = require('lodash/cloneDeep');
const loGet = require('lodash/get');
const appRootDir = require('app-root-dir');
const path = require('path');
const messages = require('./resources/messages');
const { ping: sgPing } = require('./helpers/systemGateway');
const logger = require('./helpers/logger');

const ssh = new NodeSSH();
const readFilePromisified = util.promisify(fs.readFile);

/**
 * @private
 */
async function serverSSHTest(host, port, username, privateKey) {
  try {
    await ssh.connect({
      host,
      port,
      username,
      privateKey,
    });
    logger.log('info', '(ping) SSH connection OK');
    return Promise.resolve(true);
  } catch (err) {
    logger.error(`(ping) SSH connection KO: ${err}`);
    return Promise.resolve(false);
  } finally {
    ssh.dispose();
  }
}

/**
 * Returns diagnostics with status message
 */
async function ping(req, res, appState) {
  const { ping: pingMessages } = messages;
  let statusMessage;
  if (appState.isScheduleEnabled) {
    statusMessage = pingMessages.statusTitle;
  } else {
    statusMessage = pingMessages.statusTitleNoSchedule;
  }

  const displayedConfig = loCloneDeep(config);

  // Server password setting is obfuscated
  if (loGet(displayedConfig, 'server.password')) displayedConfig.server.password = '********';

  // Diagnostics
  const host = config.get('server.hostname');
  const port = config.get('server.sshPort');
  const username = config.get('server.user');
  const privateKey = config.get('server.keyPath');

  const [isPingSuccess, isSSHSuccess] = await Promise.all([
    sgPing(host),
    serverSSHTest(host, port, username, privateKey),
  ]);

  res.send(`
<h1>${statusMessage}</h1>
<h2>${pingMessages.serverTitle}</h2>
<p>${!isPingSuccess && !isSSHSuccess ? pingMessages.offline : ''}</p>
<ul>
<li>${pingMessages.pingItem} ${isPingSuccess ? 'OK' : 'KO'}</li>
<li>${pingMessages.sshItem} ${isSSHSuccess ? 'OK' : 'KO'} </li>
</ul>
<p>${pingMessages.instructions}</p>
<h2>${pingMessages.configurationTitle}</h2>
<pre>${JSON.stringify(displayedConfig, null, '  ')}</pre>
`);

  return Promise.resolve();
}

/**
 * Handles ON request
 */
function on(req, res) {
  const macAddress = config.get('server.macAddress');
  const broadcastAddress = config.get('server.broadcastAddress');
  const options = {
    address: broadcastAddress,
  };
  wol.wake(macAddress, options, (error) => {
    if (error) {
      logger.error(`(on) ${messages.wakeKO} - ${JSON.stringify(error, null, '  ')}`);

      if (res) res.status(500).send('ko');
    } else {
      logger.log('info', `(on) ${messages.wakeOK}`);

      if (res) res.send('ok');
    }
  });
}

/**
 * Handles OFF request
 */
async function off(req, res) {
  const host = config.get('server.hostname');
  const port = config.get('server.sshPort');
  const username = config.get('server.user');
  const password = config.get('server.password');
  const privateKey = config.get('server.keyPath');
  const command = config.get('server.offCommand');

  try {
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

    if (res) res.send('ok');
  } catch (err) {
    logger.error(`(off) ${messages.sshKO} - ${JSON.stringify(err, null, '  ')}`);

    if (res) res.status(500).send('ko');
  } finally {
    ssh.dispose();
  }
}

/**
 * Handles ENABLE SCHEDULE request
 */
function enableSchedule(req, res, appState) {
  const state = appState;
  state.isScheduleEnabled = true;
  state.onJob.start();
  state.offJob.start();

  res.send('ok');
}

/**
 * Handles DISABLE SCHEDULE request
 */
function disableSchedule(req, res, appState) {
  const state = appState;
  state.isScheduleEnabled = false;
  state.onJob.stop();
  state.offJob.stop();

  res.send('ok');
}

/**
 * Handles LOGS request
 */
async function logs(req, res) {
  try {
    const logsContents = await readFilePromisified(path.join(appRootDir.get(), 'logs', 'app.log'));

    res.send(`<pre>${logsContents}<pre>`);
  } catch (error) {
    logger.error(`(logs) ${error}`);

    res.status(204).send();
  }
}

module.exports = {
  ping,
  on,
  off,
  enableSchedule,
  disableSchedule,
  logs,
};
