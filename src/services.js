const messages = require('./messages');

/**
 * Returns simple ping with status message
 */
function ping(req, res, appState) {
  if (appState.isScheduleEnabled) {
    res.send(messages.ping);
  } else {
    res.send(messages.pingNoSchedule);
  }
}

/**
 * Handles ON request
 */
function on(req, res) {
  // TODO wol call
  // const broadcastAddr = config.get('network.broadcastAddress');

  if (res) res.send('ok');
}

/**
 * Handles ON request
 */
function off(req, res) {
  // TODO ssh call

  if (res) res.send('ok');
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
 * Handles ENABLE SCHEDULE request
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
