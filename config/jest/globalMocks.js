// JS API //
const mockDateNow = jest.fn(() => new Date('June 12, 2018 14:14:00Z'));
Date.now = mockDateNow;

// NODE MODULES //
// app-root-dir
const mockAppRootDirGet = jest.fn(() => './test');
jest.mock('app-root-dir', () => ({
  get: () => mockAppRootDirGet(),
}));

// cron
const mockCronStart = jest.fn();
const mockCronJob = jest.fn(() => ({
  start: () => mockCronStart(),
}));
jest.mock('cron', () => ({
  CronJob: mockCronJob,
}));

// express-basic-auth
const mockBasicAuthPlugin = jest.fn();
jest.mock('express-basic-auth', () =>
  settings => mockBasicAuthPlugin(settings));

// node-ssh
const mockSSHConnect = jest.fn();
const mockSSHExecCommand = jest.fn();
const mockSSHDispose = jest.fn();
jest.mock('node-ssh', () => jest.fn(() => ({
  connect: o => mockSSHConnect(o),
  execCommand: c => mockSSHExecCommand(c),
  dispose: () => mockSSHDispose(),
})));

// shelljs
const mockShellMkdir = jest.fn();
jest.mock('shelljs', () => ({
  mkdir: (o, p) => mockShellMkdir(o, p),
}));

// wake_on_lan
const mockWOLWake = jest.fn();
jest.mock('wake_on_lan', () => ({
  wake: (a, o, f) => mockWOLWake(a, o, f),
}));

// winston
const mockWinstonLogger = jest.fn(() => ({
  error: () => null,
  log: () => null,
}));
const mockWinstonTransport = jest.fn();
jest.mock('winston', () => ({
  Logger: mockWinstonLogger,
  transports: {
    Console: mockWinstonTransport,
    File: mockWinstonTransport,
  },
}));

// PROJECT SPECIFIC //
const mockExpressResponseStatus = jest.fn();
const mockExpressResponseSend = jest.fn();

const mockOnJobStart = jest.fn();
const mockOffJobStart = jest.fn();
const mockOnJobStop = jest.fn();
const mockOffJobStop = jest.fn();

const mockGatewayPing = jest.fn();

module.exports = {
  dateMock: {
    now: mockDateNow,
  },
  appRootDirMock: {
    get: mockAppRootDirGet,
  },
  cronMock: {
    Job: mockCronJob,
    start: mockCronStart,
  },
  expressBasicAuthMock: mockBasicAuthPlugin,
  nodesshMock: {
    connect: mockSSHConnect,
    execCommand: mockSSHExecCommand,
    dispose: mockSSHDispose,
  },
  shelljsMock: {
    mkdir: mockShellMkdir,
  },
  winstonMock: {
    Logger: mockWinstonLogger,
    Transport: mockWinstonTransport,
  },
  wakeonlanMock: {
    wake: mockWOLWake,
  },
  expressResponseMock: {
    statusMock: mockExpressResponseStatus,
    sendMock: mockExpressResponseSend,
    status: c => mockExpressResponseStatus(c),
    send: msg => mockExpressResponseSend(msg),
  },
  jobsMock: {
    onJobStart: mockOnJobStart,
    offJobStart: mockOffJobStart,
    onJobStop: mockOnJobStop,
    offJobStop: mockOffJobStop,
  },
  systemGatewayMock: {
    ping: h => mockGatewayPing(h),
    pingMock: mockGatewayPing,
  },
};
