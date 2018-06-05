const {
  appRootDirMock,
  nodesshMock,
  wakeonlanMock,
  expressResponseMock,
  jobsMock,
  systemGatewayMock,
} = require('../config/jest/globalMocks');

jest.mock('./helpers/systemGateway', () => systemGatewayMock);

const {
  ping,
  on,
  off,
  enableSchedule,
  disableSchedule,
  logs,
} = require('./services');

describe('services functions', () => {
  beforeEach(() => {
    expressResponseMock.sendMock.mockReset();
    expressResponseMock.statusMock.mockReset();
    systemGatewayMock.pingMock.mockReset();
    nodesshMock.connect.mockReset();
    nodesshMock.execCommand.mockReset();
    nodesshMock.dispose.mockReset();
    wakeonlanMock.wake.mockReset();
    jobsMock.onJobStart.mockReset();
    jobsMock.offJobStart.mockReset();
    jobsMock.onJobStop.mockReset();
    jobsMock.offJobStop.mockReset();

    // Ping OK
    systemGatewayMock.pingMock.mockResolvedValue(true);

    // WOL OK
    wakeonlanMock.wake.mockImplementation((a, o, f) => {
      f();
    });

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
    it('should perform diagnosis and send appropriate response when schedule enabled', async () => {
      // given
      const state = {
        ...appState,
      };

      // when
      await ping({}, expressResponseMock, state);

      // then
      expect(systemGatewayMock.pingMock).toHaveBeenCalled();
      expect(systemGatewayMock.pingMock.mock.calls[0][0]).toEqual('Host Name');
      expect(nodesshMock.connect).toHaveBeenCalledWith({
        host: 'Host Name',
        port: 22,
        privateKey: 'Key Path',
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
      systemGatewayMock.pingMock.mockResolvedValue(false);

      // when
      await ping({}, expressResponseMock, state);

      // then
      expect(systemGatewayMock.pingMock).toHaveBeenCalled();
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
      expect(systemGatewayMock.pingMock).toHaveBeenCalled();
      expect(nodesshMock.connect).toHaveBeenCalled();
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should send appropriate response when server OFFLINE', async () => {
      // given
      const state = {
        ...appState,
      };
      // Ping KO
      systemGatewayMock.pingMock.mockResolvedValue(false);
      // SSH KO
      nodesshMock.connect.mockRejectedValue();

      // when
      await ping({}, expressResponseMock, state);

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
      await ping({}, expressResponseMock, state);

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
      on(undefined, expressResponseMock, appStateWithServerStopTime);

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
      on(undefined, expressResponseMock, appStateWithServerStartTime);

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
      on(undefined, expressResponseMock, appStateWithServerStopTime);

      // then
      expect(wakeonlanMock.wake).toHaveBeenCalled();
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(500);
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
      expect(appStateWithServerStopTime.serverStartedAt).toBeUndefined();
      expect(appStateWithServerStopTime.serverStoppedAt).not.toBeUndefined();
    });
  });

  describe('off function', () => {
    it('should invoke SSH and generate correct response on success', async () => {
      // given
      const appStateWithServerStartTime = {
        ...appState,
        serverStartedAt: new Date(),
      };

      // when
      await off(undefined, expressResponseMock, appStateWithServerStartTime);

      // then
      expect(nodesshMock.connect).toHaveBeenCalledWith({
        host: 'Host Name',
        port: 22,
        privateKey: 'Key Path',
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
      await off(undefined, expressResponseMock, appStateWithServerStopTime);

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
      await off(undefined, expressResponseMock, appStateWithServerStartTime);

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
      await off(undefined, expressResponseMock, appState);

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
      await off(undefined, expressResponseMock, appState);

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
      enableSchedule(undefined, expressResponseMock, state);

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
      disableSchedule(undefined, expressResponseMock, state);

      // then
      expect(jobsMock.onJobStop).toHaveBeenCalled();
      expect(jobsMock.offJobStop).toHaveBeenCalled();
      expect(state.isScheduleEnabled).toEqual(false);
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('logs function', () => {
    it('should return 204 if no log file', async () => {
      // given
      appRootDirMock.get.mockImplementationOnce(() => '/foo/bar');

      // when
      await logs(undefined, expressResponseMock);

      // then
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(204);
      expect(expressResponseMock.sendMock).toHaveBeenCalledWith(undefined);
    });

    it('should generate correct response with log file', async () => {
      // given-when
      await logs(undefined, expressResponseMock);

      // then
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });
  });
});
