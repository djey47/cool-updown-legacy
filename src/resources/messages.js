const messages = {
  intro: 'coolupdown server is starting, please wait...',
  ready: 'Ready!',
  exitNotice: '- CTRL+C (or npm stop) to stop server -',
  wakeOK: 'WOL packets sent!',
  wakeKO: 'Could not send WOL packets!',
  sshOK: 'Connected to host via SSH!',
  sshKO: 'Could not connect to host via SSH!',
  ping: {
    statusTitle: 'coolupdown alive and running!',
    statusTitleNoSchedule: 'coolupdown alive but schedule is disabled!',
    configurationTitle: 'Configuration',
    serverTitle: 'Server',
    pingItem: 'Ping test:',
    sshItem: 'SSH test:',
    instructions: 'See <a href="/logs" target="_blank">logs</a> for details.',
    offline: 'Server is likely to be OFFLINE!',
  },
};

module.exports = messages;
