import messages from '../resources/messages';

/**
 * Handles ENABLE SCHEDULE request
 */
export function enable(req, res, appState) {
  const state = appState;
  state.isScheduleEnabled = true;
  state.onJob.start();
  state.offJob.start();

  res.send(messages.status.okay);
}

/**
   * Handles DISABLE SCHEDULE request
   */
export function disable(req, res, appState) {
  const state = appState;
  state.isScheduleEnabled = false;
  state.onJob.stop();
  state.offJob.stop();

  res.send(messages.status.okay);
}
