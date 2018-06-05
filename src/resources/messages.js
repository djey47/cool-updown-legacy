/* @flow */

const messages = {
  intro: 'coolupdown server is starting, please wait...',
  outro: 'See you soon!',
  ready: 'Ready!',
  exitNotice: '- CTRL+C (or npm stop) to stop server -',
  interrupt: '/!\\ SIGINT message received! coolupdown server will close /!\\',
  wakeOK: 'WOL packets sent!',
  wakeKO: 'Could not send WOL packets!',
  sshOK: 'Connected to host via SSH!',
  sshKO: 'Could not connect to host via SSH!',
  ping: {
    statusTitle: 'coolupdown alive and running!',
    statusTitleNoSchedule: 'coolupdown alive but schedule is disabled!',
    configurationTitle: 'Configuration',
    serverTitle: 'Server',
    pingItem: 'Ping test: <b>{pingStatus}</b>',
    sshItem: 'SSH test: <b>{sshStatus}</b>',
    instructions: 'See <a href="/logs" target="_blank">logs</a> for details.',
    offline: 'Server is likely to be OFFLINE!',
    appUptime: 'Running for <b>{uptime}</b>.',
    serverUptime: 'Last start attempt: <b>{time} ago</b>.',
    serverDowntime: 'Last stop attempt: <b>{time} ago</b>.',
    serverUndefinedTime: 'Last start/stop attempt: <b>N/A</b>',
  },
  status: {
    okay: 'OK',
    kayo: 'KO',
  },
};

module.exports = messages;
