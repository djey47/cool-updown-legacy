const {
  appRootDirMock,
  axiosMock,
  nodeFSMock,
  nodesshMock,
  wakeonlanMock,
  expressResponseMock,
  jobsMock,
  systemGatewayMock: mockSystemGateway,
} = require('../config/jest/globalMocks');

jest.mock('./helpers/systemGateway', () => mockSystemGateway);

const {
  ping,
  on,
  off,
  enableSchedule,
  disableSchedule,
  logs,
} = require('./services');

const res = {
  status: c => expressResponseMock.statusMock(c),
  send: msg => expressResponseMock.sendMock(msg),
};

describe('services functions', () => {
  beforeEach(() => {
    expressResponseMock.sendMock.mockReset();
    expressResponseMock.statusMock.mockReset();
    mockSystemGateway.pingMock.mockReset();
    nodesshMock.connect.mockReset();
    nodesshMock.execCommand.mockReset();
    nodesshMock.dispose.mockReset();
    wakeonlanMock.wake.mockReset();
    jobsMock.onJobStart.mockReset();
    jobsMock.offJobStart.mockReset();
    jobsMock.onJobStop.mockReset();
    jobsMock.offJobStop.mockReset();
    nodeFSMock.readFile.mockReset();

    // Ping OK
    mockSystemGateway.pingMock.mockResolvedValue(true);

    // WOL OK
    wakeonlanMock.wake.mockImplementation((a, o, f) => {
      f();
    });

    // HTTP OK
    axiosMock.get.mockImplementation(() => Promise.resolve());

    expressResponseMock.statusMock.mockImplementation(() => expressResponseMock);

    nodesshMock.execCommand.mockResolvedValue({ stdout: '', stderr: '', code: 0 });
  });

  const appState = {
    isScheduleEnabled: true,
    startedAt: new Date('June 12, 2018 13:14:00Z'),
  };

  const mockJobs = {
    onJob: {
      start: () => jobsMock.onJobStart(),
      stop: () => jobsMock.onJobStop(),
    },
    offJob: {
      start: () => jobsMock.offJobStart(),
      stop: () => jobsMock.offJobStop(),
    },
  };

  describe('ping function', () => {
    beforeEach(() => {
      nodeFSMock.readFile.mockResolvedValue('=== PRIVATE KEY ===');
    });

    it('should perform diagnosis and send appropriate response when schedule enabled', async () => {
      // given
      const state = {
        ...appState,
      };

      // when
      await ping({}, expressResponseMock, state);

      // then
      expect(mockSystemGateway.pingMock).toHaveBeenCalled();
      expect(mockSystemGateway.pingMock.mock.calls[0][0]).toEqual('Host Name');
      expect(nodesshMock.connect).toHaveBeenCalledWith({
        host: 'Host Name',
        port: 22,
        privateKey: '=== PRIVATE KEY ===',
        username: 'User',
      });
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should send appropriate response when serverStartedAt defined', async () => {
      // given
      const state = {
        ...appState,
        serverStartedAt: new Date(Date.now()),
      };

      // when
      await ping({}, expressResponseMock, state);

      // then
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should send appropriate response when serverStoppedAt defined', async () => {
      // given
      const state = {
        ...appState,
        serverStoppedAt: new Date(Date.now()),
      };

      // when
      await ping({}, expressResponseMock, state);

      // then
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should send appropriate response when server ping KO', async () => {
      // given
      const state = {
        ...appState,
      };
      // Ping KO
      mockSystemGateway.pingMock.mockResolvedValue(false);

      // when
      await ping({}, expressResponseMock, state);

      // then
      expect(mockSystemGateway.pingMock).toHaveBeenCalled();
      expect(nodesshMock.connect).toHaveBeenCalled();
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should send appropriate response when server SSH KO', async () => {
      // given
      const state = {
        ...appState,
      };
      // SSH KO
      nodesshMock.connect.mockImplementation(() => Promise.reject());

      // when
      await ping({}, expressResponseMock, state);

      // then
      expect(mockSystemGateway.pingMock).toHaveBeenCalled();
      expect(nodesshMock.connect).toHaveBeenCalled();
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should send appropriate response when server HTTP KO', async () => {
      // given
      const state = {
        ...appState,
      };
      // SSH KO
      axiosMock.get.mockImplementation(() => Promise.reject());

      // when
      await ping({}, res, state);

      // then
      expect(mockSystemGateway.pingMock).toHaveBeenCalled();
      expect(nodesshMock.connect).toHaveBeenCalled();
      expect(axiosMock.get).toHaveBeenCalledWith('http://localhost');
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should send appropriate response when server OFFLINE', async () => {
      // given
      const state = {
        ...appState,
      };
      // Ping KO
      mockSystemGateway.pingMock.mockImplementation(() => Promise.resolve(false));
      // SSH KO
      nodesshMock.connect.mockImplementation(() => Promise.reject());
      // HTTP KO
      axiosMock.get.mockImplementation(() => Promise.reject());

      // when-then
      await ping({}, res, state);

      // then
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should send appropriate response when schedule disabled', async () => {
      // given
      const state = {
        ...appState,
        isScheduleEnabled: false,
      };

      // when
      await ping({}, res, state);

      // then
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('on function', () => {
    it('should invoke wol and generate correct response on success', () => {
      // given
      const appStateWithServerStopTime = {
        ...appState,
        serverStoppedAt: new Date(),
      };

      // when
      on(undefined, res, appStateWithServerStopTime);

      // then
      expect(wakeonlanMock.wake).toHaveBeenCalled();
      expect(wakeonlanMock.wake.mock.calls[0][0]).toEqual('FF:FF:FF:FF:FF:FF:FF:FF');
      expect(wakeonlanMock.wake.mock.calls[0][1]).toEqual({ address: '255.255.255.255' });
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
      expect(appStateWithServerStopTime.serverStartedAt.getTime()).toEqual(1528812840000);
      expect(appStateWithServerStopTime.serverStoppedAt).toBeUndefined();
    });

    it('should not alter server start time when already defined', () => {
      // given
      const appStateWithServerStartTime = {
        ...appState,
        serverStartedAt: new Date(),
      };

      // when
      on(undefined, res, appStateWithServerStartTime);

      // then
      expect(appStateWithServerStartTime.serverStartedAt).toBeDefined();
      expect(appStateWithServerStartTime.serverStartedAt.getTime()).not.toEqual(1528812840000);
    });

    it('should invoke wol and generate correct response on failure', () => {
      // given
      // WOL KO
      wakeonlanMock.wake.mockImplementation((a, o, f) => {
        f({});
      });
      const appStateWithServerStopTime = {
        ...appState,
        serverStoppedAt: new Date(),
      };

      // when
      on(undefined, res, appStateWithServerStopTime);

      // then
      expect(wakeonlanMock.wake).toHaveBeenCalled();
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(500);
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
      expect(appStateWithServerStopTime.serverStartedAt).toBeUndefined();
      expect(appStateWithServerStopTime.serverStoppedAt).not.toBeUndefined();
    });
  });

  describe('off function', () => {
    beforeEach(() => {
      nodeFSMock.readFile.mockResolvedValue('=== PRIVATE KEY ===');
    });

    it('should invoke SSH and generate correct response on success', async () => {
      // given
      const appStateWithServerStartTime = {
        ...appState,
        serverStartedAt: new Date(),
      };

      // when
      await off(undefined, res, appStateWithServerStartTime);

      // then
      expect(nodesshMock.connect).toHaveBeenCalledWith({
        host: 'Host Name',
        port: 22,
        privateKey: '=== PRIVATE KEY ===',
        username: 'User',
      });
      expect(nodesshMock.execCommand).toHaveBeenCalledWith('OFF Command');
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
      expect(appStateWithServerStartTime.serverStartedAt).toBeUndefined();
      expect(appStateWithServerStartTime.serverStoppedAt.getTime()).toEqual(1528812840000);
    });

    it('should not alter server stop time when already defined', async () => {
      // given
      const appStateWithServerStopTime = {
        ...appState,
        serverStoppedAt: new Date(),
      };

      // when
      await off(undefined, res, appStateWithServerStopTime);

      // then
      expect(appStateWithServerStopTime.serverStoppedAt).toBeDefined();
      expect(appStateWithServerStopTime.serverStoppedAt.getTime()).not.toEqual(1528812840000);
    });

    it('should invoke SSH and generate correct response on failure (promise rejection)', async () => {
      // given
      // ExecCommand KO (rejection)
      nodesshMock.execCommand.mockImplementation(() => Promise.reject());
      const appStateWithServerStartTime = {
        ...appState,
        serverStartedAt: new Date(),
      };

      // when
      await off(undefined, res, appStateWithServerStartTime);

      // then
      expect(nodesshMock.connect).toHaveBeenCalled();
      expect(nodesshMock.execCommand).toHaveBeenCalled();
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(500);
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
      expect(appStateWithServerStartTime.serverStartedAt).not.toBeUndefined();
      expect(appStateWithServerStartTime.serverStoppedAt).toBeUndefined();
    });

    it('should invoke SSH and generate correct response on command failure', async () => {
      // given
      // ExecCommand KO (non 0 exit code)
      nodesshMock.execCommand.mockImplementation(() => Promise.resolve({ stdin: '', stdout: '', code: 1 }));

      // when
      await off(undefined, res, appState);

      // then
      expect(nodesshMock.connect).toHaveBeenCalled();
      expect(nodesshMock.execCommand).toHaveBeenCalled();
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(500);
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should invoke SSH and generate correct response on connect failure', async () => {
      // given
      // Connect KO
      nodesshMock.connect.mockImplementation(() => Promise.reject());

      // when
      await off(undefined, res, appState);

      // then
      expect(nodesshMock.connect).toHaveBeenCalled();
      expect(nodesshMock.execCommand).not.toHaveBeenCalled();
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(500);
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('enableSchedule function', () => {
    it('should set jobs state correctly and generate correct response', () => {
      // given
      const state = {
        ...appState,
        ...mockJobs,
        isScheduleEnabled: false,
      };

      // when
      enableSchedule(undefined, res, state);

      // then
      expect(jobsMock.onJobStart).toHaveBeenCalled();
      expect(jobsMock.offJobStart).toHaveBeenCalled();
      expect(state.isScheduleEnabled).toEqual(true);
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('disableSchedule function', () => {
    it('should set jobs state correctly and generate correct response', () => {
      // given
      const state = {
        ...appState,
        ...mockJobs,
        isScheduleEnabled: true,
      };

      // when
      disableSchedule(undefined, res, state);

      // then
      expect(jobsMock.onJobStop).toHaveBeenCalled();
      expect(jobsMock.offJobStop).toHaveBeenCalled();
      expect(state.isScheduleEnabled).toEqual(false);
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('logs function', () => {
    beforeEach(() => {
      nodeFSMock.readFile.mockResolvedValue('These are logs contents');
    });

    it('should return 204 if no log file', async () => {
      // given
      nodeFSMock.readFile.mockRejectedValue('file not found');
      appRootDirMock.get.mockImplementationOnce(() => '/foo/bar');

      // when
      await logs(undefined, res);

      // then
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(204);
      expect(expressResponseMock.sendMock).toHaveBeenCalledWith(undefined);
    });

    it('should generate correct response with log file', async () => {
      // given-when
      await logs(undefined, res);

      // then
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
      // done();
    });
  });
});
