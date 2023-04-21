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
import { AppConfig, AppState } from '../model/models';
import { TypedResponse } from '../model/express';
import { readPackageConfiguration } from '../helpers/project';

const ssh = new NodeSSH();
const { cloneDeep: loCloneDeep, get: loGet } = lodash;
const { differenceInMilliseconds } = dateFns;

/**
 * @private
 * @return duration in human readable format
 */
function computeDuration(from: Date, to: Date) {
  const diff = differenceInMilliseconds(to, from);
  return toHumanDuration(getTimeDetails(diff));
}

/**
 * @private
 */
async function serverSSHTest(host: string, port: number, username: string) {
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
async function serverHTTPTest(url: string) {
  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    await axios.get(url, { httpsAgent });
    logger.log('info', '(ping) HTTP connection OK');
    return Promise.resolve(true);
  } catch (err: unknown) {
    logger.error(`(ping) HTTP connection KO: ${err}`);
    return Promise.resolve(false);
  }
}

/**
 * Returns diagnostics with status message
 */
export default async function ping(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  const {
    isScheduleEnabled, startedAt, serverStartedAt, serverStoppedAt,
  } = appState;
  const {
    ping: pingMessages, status: statusMessages,
  } = messages;

  let statusMessage: string;
  if (isScheduleEnabled) {
    statusMessage = pingMessages.statusTitle;
  } else {
    statusMessage = pingMessages.statusTitleNoSchedule;
  }

  // Server password setting is obfuscated
  const displayedConfig = loCloneDeep(config) as AppConfig;
  if (loGet(displayedConfig, 'server.password')) displayedConfig.server.password = '********';

  // Diagnostics
  const host = config.get('server.hostname') as string;
  const port = config.get('server.sshPort') as number;
  const username = config.get('server.user') as string;
  const url = config.get('server.url') as string;

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

  // Package configuration
  const packageConfig = await readPackageConfiguration();

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
  <hr/>
  <section><p><em>${packageConfig.name}, v${packageConfig.version}</em></p></section>
  `);
}
