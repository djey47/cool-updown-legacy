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
const { cloneDeep: loCloneDeep } = lodash;
const { differenceInMilliseconds } = dateFns;

interface Diagnostics {
  httpStatus: string;
  isHTTPSuccess: boolean;
  isPingSuccess: boolean;
  isSSHSuccess: boolean;
  pingStatus: string;
  serverUpDownTimeMessage: string;
  sshStatus: string;
  url: string;
  hostname?: string;
  scheduleStatus: string;
}

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
async function serverSSHTest(host: string, port: number, username: string, privateKeyPath?: string) {
  const privateKey = await readPrivateKey(privateKeyPath);
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

function getDisplayedConfiguration(config: AppConfig) {
  const OBFUSCATED_PWD = '********';
  const displayedConfig = loCloneDeep(config) as AppConfig;
  // App password setting is obfuscated
  if (displayedConfig.app?.password) {
    displayedConfig.app.password = OBFUSCATED_PWD;
  }
  // Server password setting is obfuscated
  displayedConfig.servers.forEach((s) => {
    if (s.ssh?.password) {
      s.ssh.password = OBFUSCATED_PWD;
    }
  })

  return displayedConfig;
}

async function diagnose(config: AppConfig, appState: AppState): Promise<Diagnostics[]> {
  const {
    ping: pingMessages, status: statusMessages,
  } = messages;
  const {
    serverStartedAt, serverStoppedAt,
  } = appState;

  const diagPromises = config.servers.map(async (s) => {
    const host = s.network?.hostname || undefined;
    const port = s.ssh?.port || undefined;
    const username = s.ssh?.user || undefined;
    const url = s.url || undefined;
    const hostname = s.network?.hostname || undefined;
    const isScheduleEnabled = s.schedule?.enabled || false;
    const privateKeyPath = s.ssh?.keyPath || undefined;
    
    const [isPingSuccess, isSSHSuccess, isHTTPSuccess] = await Promise.all([
      gatewayPing(host),
      serverSSHTest(host, port, username, privateKeyPath),
      url ? serverHTTPTest(url) : Promise.resolve(false),
    ]);

    // Uptime/Downtime server calculation
    const now = new Date(Date.now());
    const time = computeDuration(serverStartedAt || serverStoppedAt || now, now);
    let serverUpDownTimeMessage = pingMessages.serverUndefinedTime;
    if (serverStartedAt) {
      serverUpDownTimeMessage = interpolate(pingMessages.serverUptime, { time });
    } else if (serverStoppedAt) {
      serverUpDownTimeMessage = interpolate(pingMessages.serverDowntime, { time });
    }

    return {
      isPingSuccess,
      isSSHSuccess,
      isHTTPSuccess,
      pingStatus: isPingSuccess ? statusMessages.okay : statusMessages.kayo,
      sshStatus: isSSHSuccess ? statusMessages.okay : statusMessages.kayo,
      httpStatus: isHTTPSuccess ? statusMessages.okay : statusMessages.kayo,
      serverUpDownTimeMessage,
      url,
      hostname,
      scheduleStatus: isScheduleEnabled ? statusMessages.enabled : statusMessages.disabled,
    };
  });

  return Promise.all(diagPromises); 
}

/**
 * Returns diagnostics with status message
 */
export default async function ping(req: Express.Request, res: TypedResponse<string>, appState: AppState) {
  const {
    startedAt,
  } = appState;
  const {
    ping: pingMessages,
  } = messages;

  // Prepare configuration to be displayed
  const appConfig = config as unknown as AppConfig;
  const displayedConfig = getDisplayedConfiguration(appConfig);

  // Diagnostics
  const diags = await diagnose(appConfig, appState);

  // Uptime app calculation
  const now = new Date(Date.now());
  const uptime = computeDuration(startedAt || now, now);
  
  // Package configuration
  const packageConfig = await readPackageConfiguration();

  const serverDiagnostics = diags.map((d) => {
    const { httpStatus, pingStatus, sshStatus, isPingSuccess, isSSHSuccess, serverUpDownTimeMessage, url, hostname, scheduleStatus } = d;

    return `
      <li>
        <h2>${pingMessages.serverTitle}${hostname && (': ' + hostname) || ''}</h2>
        <p>${!isPingSuccess && !isSSHSuccess ? pingMessages.offline : ''}</p>
        <ul>
          <li>${interpolate(pingMessages.scheduleItem, { scheduleStatus })}</li>
          <li>${serverUpDownTimeMessage}</li>
          <li>${interpolate(pingMessages.pingItem, { pingStatus })}</li>
          <li>${interpolate(pingMessages.sshItem, { sshStatus })}</li>
          <li>${interpolate(pingMessages.httpItem, { httpStatus, url })}</li>
        </ul>
      </li>
    `;
  }).join('\n');

  const htmlResult = `
  <h1>${pingMessages.statusTitle}</h1>
  <p><em>${interpolate(pingMessages.appUptime, { uptime })}</em></p>
  <ul>
  ${serverDiagnostics}
  </ul>
  <p>${pingMessages.instructions}</p>
  <h2>${pingMessages.configurationTitle}</h2>
  <pre>${JSON.stringify(displayedConfig, null, 2)}</pre>
  <hr/>
  <section><p><em>${packageConfig.name}, v${packageConfig.version}</em></p></section>
  `;

  res.send(htmlResult);
}
