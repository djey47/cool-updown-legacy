export default {
  intro: 'coolupdown server is starting, please wait...',
  outro: 'See you soon!',
  ready: 'Ready!',
  exitNotice: '- CTRL+C (or npm stop) to stop server -',
  interrupt: '/!\\ SIGINT message received! coolupdown server will close /!\\',
  wakeOK: 'WOL packets sent!',
  wakeKO: 'Could not send WOL packets!',
  sshOK: 'Connected to host via SSH!',
  sshKO: 'Could not connect to host via SSH!',
  home: 'Home',
  bytes: 'bytes',
  ping: {
    statusTitle: 'coolupdown alive and running!',
    statusTitleNoSchedule: 'coolupdown alive but schedule is disabled!',
    configurationTitle: 'Configuration',
    serverTitle: 'Server #{serverId}',
    pingItem: 'Ping test: <b>{pingStatus}</b>',
    scheduleItem: 'Schedule: <b>{scheduleStatus}</b>',
    sshItem: 'SSH test: <b>{sshStatus}</b>',
    httpItem: 'HTTP test: <b>{httpStatus}</b> <a href="{url}" target="_blank">URL</a>',
    actionsItem: 'Actions: <a href="{onUrl}">Power ON</a> | <a href="{offUrl}">Power OFF</a> | <a href="{enableScheduleUrl}">Schedule ENABLE</a> | <a href="{disableScheduleUrl}">Schedule DISABLE</a>',
    instructions: 'See <a href="/logs" target="_blank">logs</a> for details.',
    offline: 'Server is likely to be OFFLINE!',
    appUptime: 'Running for <b>{uptime}</b> - refresh every <b>{refreshInterval} second(s)</b> .',
    serverUptime: 'Last start attempt: <b>{time} ago</b>.',
    serverDowntime: 'Last stop attempt: <b>{time} ago</b>.',
    serverUndefinedTime: 'Last start/stop attempt: <b>N/A</b>',
  },
  status: {
    disabled: 'DISABLED',
    enabled: 'ENABLED',
    kayo: 'KO',
    okay: 'OK',
    noop: 'NOOP',
  },
  dates: {
    days: 'day(s)',
    hours: 'hour(s)',
    minutes: 'minute(s)',
    lessThanOneMinute: 'less than one minute',
  },
  errors: {
    invalidArg: 'Invalid argument specified!',
  },
  logs: {
    none: 'No logs available!',
  }
};
