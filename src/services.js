const NodeSSH = require('node-ssh');
const wol = require('wake_on_lan');
const config = require('config');
const loCloneDeep = require('lodash/cloneDeep');
const loGet = require('lodash/get');
const messages = require('./messages');

const ssh = new NodeSSH();

/**
 * Returns simple ping with status message
 */
function ping(req, res, appState) {
  let statusMessage;
  if (appState.isScheduleEnabled) {
    statusMessage = messages.ping;
  } else {
    statusMessage = messages.pingNoSchedule;
  }

  const displayedConfig = loCloneDeep(config);

  // Server password setting is obfuscated
  if (loGet(displayedConfig, 'server.password')) displayedConfig.server.password = '********';

  res.send(`<h1>${statusMessage}</h1><pre>${JSON.stringify(displayedConfig, null, '  ')}</pre>`);
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
      console.error(`${messages.wakeKO}\n${JSON.stringify(error, null, '  ')}`);

      if (res) res.status(500).send('ko');
    } else {
      console.log(messages.wakeOK);

      if (res) res.send('ok');
    }
  });
}

/**
 * Handles OFF request
 */
function off(req, res) {
  const host = config.get('server.hostname');
  const port = config.get('server.sshPort');
  const username = config.get('server.user');
  const password = config.get('server.password');
  const privateKey = config.get('server.keyPath');
  const command = config.get('server.offCommand');
  ssh.connect({
    host,
    port,
    username,
    privateKey,
  }).then(() => {
    console.log(messages.sshOK);

    ssh.execCommand(command, { stdin: `${password}\n` }).then(({ stdout, stderr }) => {
      console.log(`STDOUT: ${stdout}`);
      console.error(`STDERR: ${stderr}`);
    });

    if (res) res.send('ok');
  }, (error) => {
    console.log(`${messages.sshKO}\n${JSON.stringify(error, null, '  ')}`);

    if (res) res.status(500).send('ko');
  });
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

module.exports = {
  ping,
  on,
  off,
  enableSchedule,
  disableSchedule,
};
