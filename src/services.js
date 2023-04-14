const { NodeSSH } = require('node-ssh');
const wol = require('wake_on_lan');
const config = require('config');
const fs = require('fs');
const util = require('util');
const loCloneDeep = require('lodash/cloneDeep');
const loGet = require('lodash/get');
const appRootDir = require('app-root-dir');
const path = require('path');
const differenceInMilliseconds = require('date-fns/difference_in_milliseconds');
const axios = require('axios');
const https = require('https');
const messages = require('./resources/messages');
const systemGateway = require('./helpers/systemGateway');
const logger = require('./helpers/logger');
const { interpolate, toHumanDuration } = require('./helpers/format');
const { getTimeDetails } = require('./helpers/date');

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
    return true;
  } catch (err) {
    logger.error(`(ping) SSH connection KO: ${err}`);
    return false;
  } finally {
    ssh.dispose();
  }
}

/**
 * @private
 */
async function serverHTTPTest(url) {
  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    await axios.default.get(url, { httpsAgent });
    logger.log('info', '(ping) HTTP connection OK');
    return Promise.resolve(true);
  } catch (err) {
    logger.error(`(ping) HTTP connection KO: ${err}`);
    return Promise.resolve(false);
  }
}

/**
 * @private
 * @return duration in human readable format
 */
function computeDuration(from, to) {
  const diff = differenceInMilliseconds(to, from);
  return toHumanDuration(getTimeDetails(diff));
}

/**
 * Returns diagnostics with status message
 */
async function ping(req, res, appState) {
  const {
    isScheduleEnabled, startedAt, serverStartedAt, serverStoppedAt,
  } = appState;
  const {
    ping: pingMessages, status: statusMessages,
  } = messages;

  let statusMessage;
  if (isScheduleEnabled) {
    statusMessage = pingMessages.statusTitle;
  } else {
    statusMessage = pingMessages.statusTitleNoSchedule;
  }

  // Server password setting is obfuscated
  const displayedConfig = loCloneDeep(config);
  if (loGet(displayedConfig, 'server.password')) displayedConfig.server.password = '********';

  // Diagnostics
  const host = config.get('server.hostname');
  const port = config.get('server.sshPort');
  const username = config.get('server.user');
  const privateKey = config.get('server.keyPath');
  const url = config.get('server.url');

  const [isPingSuccess, isSSHSuccess, isHTTPSuccess] = await Promise.all([
    systemGateway.ping(host),
    serverSSHTest(host, port, username, privateKey),
    url ? serverHTTPTest(url) : Promise.resolve(false),
  ]);
  const pingStatus = isPingSuccess ? statusMessages.okay : statusMessages.kayo;
  const sshStatus = isSSHSuccess ? statusMessages.okay : statusMessages.kayo;
  const httpStatus = isHTTPSuccess ? statusMessages.okay : statusMessages.kayo;

  // Uptime app calculation
  const now = new Date(Date.now());
  const uptime = computeDuration(startedAt || now, now);

  // Uptime/Downtime server calculation
  const time = computeDuration(serverStartedAt || serverStoppedAt || now, now);
  let serverUpDownTimeMessage = pingMessages.serverUndefinedTime;
  if (serverStartedAt) {
    serverUpDownTimeMessage = interpolate(pingMessages.serverUptime, { time });
  } else if (serverStoppedAt) {
    serverUpDownTimeMessage = interpolate(pingMessages.serverDowntime, { time });
  }

  res.send(`
<h1>${statusMessage}</h1>
<p><em>${interpolate(pingMessages.appUptime, { uptime })}</em></p>
<h2>${pingMessages.serverTitle}</h2>
<p>${!isPingSuccess && !isSSHSuccess ? pingMessages.offline : ''}</p>
<ul>
  <li>${serverUpDownTimeMessage}</li>
  <li>${interpolate(pingMessages.pingItem, { pingStatus })}</li>
  <li>${interpolate(pingMessages.sshItem, { sshStatus })}</li>
  <li>${interpolate(pingMessages.httpItem, { httpStatus, url })}</li>
</ul>
<p>${pingMessages.instructions}</p>
<h2>${pingMessages.configurationTitle}</h2>
<pre>${JSON.stringify(displayedConfig, null, 2)}</pre>
`);
}

/**
 * Handles ON request
 */
function on(req, res, appState) {
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
async function off(req, res, appState) {
  const currentState = appState;
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

/**
 * Handles ENABLE SCHEDULE request
 */
function enableSchedule(req, res, appState) {
  const state = appState;
  state.isScheduleEnabled = true;
  state.onJob.start();
  state.offJob.start();

  res.send(messages.status.okay);
}

/**
 * Handles DISABLE SCHEDULE request
 */
function disableSchedule(req, res, appState) {
  const state = appState;
  state.isScheduleEnabled = false;
  state.onJob.stop();
  state.offJob.stop();

  res.send(messages.status.okay);
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
