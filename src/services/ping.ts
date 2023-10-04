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
import { AppConfig, AppState, ServerConfig } from '../model/models';
import { TypedResponse } from '../model/express';
import { readPackageConfiguration } from '../helpers/project';
import { generatePage } from '../helpers/page';
import { MetaOptions } from '../model/page';
import { getSSHParameters } from '../helpers/ssh';

const ssh = new NodeSSH();
const { cloneDeep: loCloneDeep } = lodash;
const { differenceInMilliseconds } = dateFns;

const DEFAULT_STATUS_REFRESH_SECONDS = 60;

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
async function serverSSHTest(serverId: number, serverConfiguration: ServerConfig) {
  try {
    const sshClientConfig = await getSSHParameters(serverConfiguration);
    await ssh.connect(sshClientConfig);
    logger.info(`(ping:${serverId}) SSH connection OK`);
    return true;
  } catch (err) {
    logger.error(`(ping:${serverId}) SSH connection KO: ${err}`);
    return false;
  } finally {
    ssh.dispose();
  }
}

/**
 * @private
 */
async function serverHTTPTest(serverId: number, url: string) {
  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    await axios.get(url, { httpsAgent });
    logger.info(`(ping:${serverId}) HTTP connection OK`);
    return Promise.resolve(true);
  } catch (err: unknown) {
    logger.error(`(ping:${serverId}) HTTP connection KO: ${err}`);
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

  const diagPromises = config.servers.map(async (s, serverId) => {
    const {
      startedAt: serverStartedAt, stoppedAt: serverStoppedAt, isScheduleEnabled: serverScheduleEnabled
    } = appState.servers[serverId];
    const host = s.network?.hostname || undefined;
    const url = s.url || undefined;
    const hostname = s.network?.hostname || undefined;
    const isScheduleEnabled = serverScheduleEnabled || false;

    const [isPingSuccess, isSSHSuccess, isHTTPSuccess] = await Promise.all([
      gatewayPing(host),
      serverSSHTest(serverId, s),
      url ? serverHTTPTest(serverId, url) : Promise.resolve(false),
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

const configKeySorter = (key, value) =>
  value instanceof Object && !(value instanceof Array) ?
    Object.keys(value)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = value[key];
        return sorted
      }, {}) :
    value;

/**
 * Returns diagnostics with status message
 */
export default async function ping(_req: Express.Request, res: TypedResponse<string>, appState: AppState) {
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
  const serverDiagnostics = formatDiagnostics(diags);

  // Uptime app calculation
  const now = new Date(Date.now());
  const uptime = computeDuration(startedAt || now, now);

  // Refresh interval
  const refreshInterval = appConfig.ui?.statusRefreshInterval == undefined ? DEFAULT_STATUS_REFRESH_SECONDS : appConfig.ui?.statusRefreshInterval;

  // Package configuration
  const packageConfig = await readPackageConfiguration();

  const htmlResult = `
  <h1>${pingMessages.statusTitle}</h1>
  <p><em>${interpolate(pingMessages.appUptime, { uptime, refreshInterval })}</em></p>
  <ul>
  ${serverDiagnostics}
  </ul>
  <p>${pingMessages.instructions}</p>
  <h2>${pingMessages.configurationTitle}</h2>
  <pre>${JSON.stringify(displayedConfig, configKeySorter, 2)}</pre>
  <hr/>
  <section><p><em>${packageConfig.name}, v${packageConfig.version}</em></p></section>
  `;

  const metaOptions = buildMetaOptions(appConfig);

  res.send(generatePage(htmlResult, metaOptions));
}

function resolveBaseServiceUrl(serverId: number) {
  return `/${serverId}/`;
}

function resolvePowerServiceUrls(serverId: number) {
  const powerUrlBase = resolveBaseServiceUrl(serverId);
  return {
    onUrl: `${powerUrlBase}on`,
    offUrl: `${powerUrlBase}off`,
  };
}

function resolveScheduleServiceUrls(serverId: number) {
  const powerUrlBase = resolveBaseServiceUrl(serverId);
  return {
    enableScheduleUrl: `${powerUrlBase}enable`,
    disableScheduleUrl: `${powerUrlBase}disable`,
  };
}

function buildMetaOptions(appConfig: AppConfig): MetaOptions {
  const statusRefreshInterval = appConfig.ui?.statusRefreshInterval;
  return {
    refreshSeconds: statusRefreshInterval === undefined ? DEFAULT_STATUS_REFRESH_SECONDS : statusRefreshInterval,
  };
}

function formatDiagnostics(diags: Diagnostics[]) {
  const {
    ping: pingMessages,
  } = messages;

  return diags.map((d, serverId) => {
    const { httpStatus, pingStatus, sshStatus, isPingSuccess, isSSHSuccess, serverUpDownTimeMessage, url, hostname, scheduleStatus } = d;

    const powerUrls = resolvePowerServiceUrls(serverId);
    const scheduleUrls = resolveScheduleServiceUrls(serverId);

    return `
      <li>
        <h2>${interpolate(pingMessages.serverTitle, { serverId })}${hostname && (': ' + hostname) || ''}</h2>
        <p>${!isPingSuccess && !isSSHSuccess ? pingMessages.offline : ''}</p>
        <ul>
          <li>${interpolate(pingMessages.scheduleItem, { scheduleStatus })}</li>
          <li>${serverUpDownTimeMessage}</li>
          <li>${interpolate(pingMessages.pingItem, { pingStatus })}</li>
          <li>${interpolate(pingMessages.sshItem, { sshStatus })}</li>
          <li>${interpolate(pingMessages.httpItem, { httpStatus, url })}</li>
          <li>${interpolate(pingMessages.actionsItem, { ...powerUrls, ...scheduleUrls })}</li>
        </ul>
      </li>
    `;
  }).join('\n');
}
