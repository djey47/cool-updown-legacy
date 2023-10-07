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
import { AppConfig, AppState, FeatureStatus, ServerConfig } from '../model/models';
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
  httpFeatureStatus: FeatureStatus;
  pingFeatureStatus: FeatureStatus;
  sshFeatureStatus: FeatureStatus;
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
  if (!serverConfiguration.ssh) {
    return FeatureStatus.UNAVAILABLE;
  }

  try {
    const sshClientConfig = await getSSHParameters(serverConfiguration);
    await ssh.connect(sshClientConfig);
    logger.info(`(ping:${serverId}) SSH connection OK`);
    return FeatureStatus.OK;
  } catch (err) {
    logger.error(`(ping:${serverId}) SSH connection KO: ${err}`);
    return FeatureStatus.KO;
  } finally {
    ssh.dispose();
  }
}

/**
 * @private
 */
async function serverHTTPTest(serverId: number, url: string) {
  if (!url) {
    return FeatureStatus.UNAVAILABLE;
  }

  try {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    await axios.get(url, { httpsAgent });
    logger.info(`(ping:${serverId}) HTTP connection OK`);
    return Promise.resolve(FeatureStatus.OK);
  } catch (err: unknown) {
    logger.error(`(ping:${serverId}) HTTP connection KO: ${err}`);
    return Promise.resolve(FeatureStatus.KO);
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

  const diagPromises = config.servers.map(async (serverConfig, serverId) => {
    const {
      startedAt: serverStartedAt, stoppedAt: serverStoppedAt, isScheduleEnabled: serverScheduleEnabled
    } = appState.servers[serverId];
    const url = serverConfig.url || undefined;
    const hostname = serverConfig.network?.hostname || undefined;
    const isScheduleEnabled = serverScheduleEnabled || false;

    const [pingFeatureStatus, sshFeatureStatus, httpFeatureStatus] = await Promise.all([
      gatewayPing(hostname),
      serverSSHTest(serverId, serverConfig),
      serverHTTPTest(serverId, url),
    ]);

    // Uptime/Downtime server calculation
    const now = new Date(Date.now());
    const time = computeDuration(serverStartedAt || serverStoppedAt || now, now);
    let serverUpDownTimeMessage;
    if (!serverStartedAt && !serverStoppedAt) {
      serverUpDownTimeMessage = pingMessages.serverUndefinedTime;
    } else {
      if (!serverStoppedAt || dateFns.isAfter(serverStartedAt, serverStoppedAt)) {
        serverUpDownTimeMessage = interpolate(pingMessages.serverUptime, { time });
      }
      if (!serverStartedAt || dateFns.isAfter(serverStoppedAt, serverStartedAt)) {
        serverUpDownTimeMessage = interpolate(pingMessages.serverDowntime, { time });
      } 
    }

    return {
      pingFeatureStatus,
      sshFeatureStatus,
      httpFeatureStatus,
      pingStatus: featureStatusToMessage(pingFeatureStatus),
      sshStatus: featureStatusToMessage(sshFeatureStatus),
      httpStatus: featureStatusToMessage(httpFeatureStatus),
      serverUpDownTimeMessage,
      url,
      hostname,
      scheduleStatus: isScheduleEnabled ? statusMessages.enabled : statusMessages.disabled,
    };
  });

  return Promise.all(diagPromises);
}

const configKeySorter = (_key, value) =>
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
  updateAppStateWithDiags(appState, diags);
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
    const { httpStatus, pingStatus, sshStatus, pingFeatureStatus, httpFeatureStatus, serverUpDownTimeMessage, url, hostname, scheduleStatus } = d;

    const powerUrls = resolvePowerServiceUrls(serverId);
    const scheduleUrls = resolveScheduleServiceUrls(serverId);
    const httpLinkUrl = httpFeatureStatus === FeatureStatus.UNAVAILABLE ? '' : interpolate(pingMessages.httpLinkItem, { url });

    return `
      <li>
        <h2>${interpolate(pingMessages.serverTitle, { serverId })}${hostname && (': ' + hostname) || ''}</h2>
        <p>${pingFeatureStatus === FeatureStatus.KO ? pingMessages.offline : ''}</p>
        <ul>
          <li>${interpolate(pingMessages.scheduleItem, { scheduleStatus })}</li>
          <li>${serverUpDownTimeMessage}</li>
          <li>${interpolate(pingMessages.pingItem, { pingStatus })}</li>
          <li>${interpolate(pingMessages.sshItem, { sshStatus })}</li>
          <li>${interpolate(pingMessages.httpItem, { httpStatus })} ${httpLinkUrl}</li>
          <li>${interpolate(pingMessages.actionsItem, { ...powerUrls, ...scheduleUrls })}</li>
        </ul>
      </li>
    `;
  }).join('\n');
}

function updateAppStateWithDiags(appState: AppState, diags: Diagnostics[]) {
  // console.log('ping::updateAppStateWithDiags', {  appState, diags });
  
  diags.forEach((diag, serverId) => {
    appState.servers[serverId].lastPingStatus = diag.pingFeatureStatus;
  });

  // console.log('ping::updateAppStateWithDiags', { appState });
}

function featureStatusToMessage(featureStatus: FeatureStatus) {
  const {
    status: statusMessages,
  } = messages;

  switch(featureStatus) {
    case FeatureStatus.OK:
      return statusMessages.okay;
    case FeatureStatus.KO:
      return statusMessages.kayo;
    case FeatureStatus.UNAVAILABLE:
      return statusMessages.unavail;
  }
}
