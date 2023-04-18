import axios from 'axios';
import config from 'config';
import lodash from 'lodash';
import { NodeSSH } from 'node-ssh';
import dateFns from 'date-fns';
import https from 'https';
import messages from '../resources/messages';
import { ping as gatewayPing } from '../helpers/systemGateway';
import logger from '../helpers/logger';
import { interpolate, toHumanDuration } from '../helpers/format';
import { getTimeDetails } from '../helpers/date';
import { readPrivateKey } from '../helpers/auth';

const ssh = new NodeSSH();
const { cloneDeep: loCloneDeep, get: loGet } = lodash;
const { differenceInMilliseconds } = dateFns;

/**
 * @private
 * @return duration in human readable format
 */
function computeDuration(from, to) {
  const diff = differenceInMilliseconds(to, from);
  return toHumanDuration(getTimeDetails(diff));
}

/**
 * @private
 */
async function serverSSHTest(host, port, username) {
  const privateKey = await readPrivateKey();
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
    await axios.get(url, { httpsAgent });
    logger.log('info', '(ping) HTTP connection OK');
    return Promise.resolve(true);
  } catch (err) {
    logger.error(`(ping) HTTP connection KO: ${err}`);
    return Promise.resolve(false);
  }
}

/**
 * Returns diagnostics with status message
 */
export default async function ping(req, res, appState) {
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
  const url = config.get('server.url');

  const [isPingSuccess, isSSHSuccess, isHTTPSuccess] = await Promise.all([
    gatewayPing(host),
    serverSSHTest(host, port, username),
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
