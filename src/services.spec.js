const {
  appRootDirMock,
  axiosMock,
  nodesshMock,
  wakeonlanMock,
} = require('../config/jest/globalMocks');
const {
  ping,
  on,
  off,
  enableSchedule,
  disableSchedule,
  logs,
} = require('./services');

const mockSend = jest.fn();
const mockStatus = jest.fn();
const mockGatewayPing = jest.fn();
const mockOnJobStart = jest.fn();
const mockOffJobStart = jest.fn();
const mockOnJobStop = jest.fn();
const mockOffJobStop = jest.fn();

jest.mock('./helpers/systemGateway', () => ({
  ping: h => mockGatewayPing(h),
}));

const res = {
  status: c => mockStatus(c),
  send: msg => mockSend(msg),
};

describe('services functions', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockStatus.mockReset();
    mockGatewayPing.mockReset();
    nodesshMock.connect.mockReset();
    nodesshMock.execCommand.mockReset();
    nodesshMock.dispose.mockReset();
    wakeonlanMock.wake.mockReset();
    mockOnJobStart.mockReset();
    mockOffJobStart.mockReset();
    mockOnJobStop.mockReset();
    mockOffJobStop.mockReset();

    // Ping OK
    mockGatewayPing.mockImplementation(() => Promise.resolve(true));

    // WOL OK
    wakeonlanMock.wake.mockImplementation((a, o, f) => {
      f();
    });

    // HTTP OK
    axiosMock.get.mockImplementation(() => Promise.resolve());

    mockStatus.mockImplementation(() => res);

    nodesshMock.execCommand.mockImplementation(() => Promise.resolve({ stdout: '', stderr: '', code: 0 }));
  });

  const appState = {
    isScheduleEnabled: true,
    startedAt: new Date('June 12, 2018 13:14:00Z'),
  };

  const mockJobs = {
    onJob: {
      start: () => mockOnJobStart(),
      stop: () => mockOnJobStop(),
    },
    offJob: {
      start: () => mockOffJobStart(),
      stop: () => mockOffJobStop(),
    },
  };

  describe('ping function', () => {
    it('should perform diagnosis and send appropriate response when schedule enabled', (done) => {
      // given
      const state = {
        ...appState,
      };

      // when-then
      ping({}, res, state).then(() => {
        expect(mockGatewayPing).toHaveBeenCalled();
        expect(mockGatewayPing.mock.calls[0][0]).toEqual('Host Name');
        expect(nodesshMock.connect).toHaveBeenCalledWith({
          host: 'Host Name',
          port: 22,
          privateKey: 'Key Path',
          username: 'User',
        });
        expect(nodesshMock.dispose).toHaveBeenCalled();
        expect(axiosMock.get).toHaveBeenCalledWith('http://localhost');
        expect(mockSend).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should send appropriate response when serverStartedAt defined', (done) => {
      // given
      const state = {
        ...appState,
        serverStartedAt: new Date(Date.now()),
      };

      // when-then
      ping({}, res, state).then(() => {
        expect(mockSend).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should send appropriate response when serverStoppedAt defined', (done) => {
      // given
      const state = {
        ...appState,
        serverStoppedAt: new Date(Date.now()),
      };

      // when-then
      ping({}, res, state).then(() => {
        expect(mockSend).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should send appropriate response when server ping KO', (done) => {
      // given
      const state = {
        ...appState,
      };
      // Ping KO
      mockGatewayPing.mockImplementation(() => Promise.resolve(false));


      // when-then
      ping({}, res, state).then(() => {
        expect(mockGatewayPing).toHaveBeenCalled();
        expect(nodesshMock.connect).toHaveBeenCalled();
        expect(nodesshMock.dispose).toHaveBeenCalled();
        expect(axiosMock.get).toHaveBeenCalled();
        expect(mockSend).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should send appropriate response when server SSH KO', (done) => {
      // given
      const state = {
        ...appState,
      };
      // SSH KO
      nodesshMock.connect.mockImplementation(() => Promise.reject());

      // when-then
      ping({}, res, state).then(() => {
        expect(mockGatewayPing).toHaveBeenCalled();
        expect(nodesshMock.connect).toHaveBeenCalled();
        expect(nodesshMock.dispose).toHaveBeenCalled();
        expect(axiosMock.get).toHaveBeenCalled();
        expect(mockSend).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should send appropriate response when server HTTP KO', (done) => {
      // given
      const state = {
        ...appState,
      };
      // SSH KO
      axiosMock.get.mockImplementation(() => Promise.reject());

      // when-then
      ping({}, res, state).then(() => {
        expect(mockGatewayPing).toHaveBeenCalled();
        expect(nodesshMock.connect).toHaveBeenCalled();
        expect(axiosMock.get).toHaveBeenCalledWith('http://localhost');
        expect(mockSend).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should send appropriate response when server OFFLINE', (done) => {
      // given
      const state = {
        ...appState,
      };
      // Ping KO
      mockGatewayPing.mockImplementation(() => Promise.resolve(false));
      // SSH KO
      nodesshMock.connect.mockImplementation(() => Promise.reject());
      // HTTP KO
      axiosMock.get.mockImplementation(() => Promise.reject());

      // when-then
      ping({}, res, state).then(() => {
        expect(mockSend).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should send appropriate response when schedule disabled', () => {
      // given
      const state = {
        ...appState,
        isScheduleEnabled: false,
      };

      // when-then
      ping({}, res, state).then(() => {
        expect(mockSend).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
      });
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
      expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
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
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
      expect(appStateWithServerStopTime.serverStartedAt).toBeUndefined();
      expect(appStateWithServerStopTime.serverStoppedAt).not.toBeUndefined();
    });
  });

  describe('off function', () => {
    it('should invoke SSH and generate correct response on success', (done) => {
      // given
      const appStateWithServerStartTime = {
        ...appState,
        serverStartedAt: new Date(),
      };

      // when-then
      off(undefined, res, appStateWithServerStartTime).then(() => {
        expect(nodesshMock.connect).toHaveBeenCalledWith({
          host: 'Host Name',
          port: 22,
          privateKey: 'Key Path',
          username: 'User',
        });
        expect(nodesshMock.execCommand).toHaveBeenCalledWith('OFF Command');
        expect(nodesshMock.dispose).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        expect(appStateWithServerStartTime.serverStartedAt).toBeUndefined();
        expect(appStateWithServerStartTime.serverStoppedAt.getTime()).toEqual(1528812840000);
        done();
      });
    });

    it('should not alter server stop time when already defined', (done) => {
      // given
      const appStateWithServerStopTime = {
        ...appState,
        serverStoppedAt: new Date(),
      };

      // when-then
      off(undefined, res, appStateWithServerStopTime).then(() => {
        expect(appStateWithServerStopTime.serverStoppedAt).toBeDefined();
        expect(appStateWithServerStopTime.serverStoppedAt.getTime()).not.toEqual(1528812840000);
        done();
      });
    });

    it('should invoke SSH and generate correct response on failure (promise rejection)', (done) => {
      // given
      // ExecCommand KO (rejection)
      nodesshMock.execCommand.mockImplementation(() => Promise.reject());
      const appStateWithServerStartTime = {
        ...appState,
        serverStartedAt: new Date(),
      };

      // when-then
      off(undefined, res, appStateWithServerStartTime).then(() => {
        expect(nodesshMock.connect).toHaveBeenCalled();
        expect(nodesshMock.execCommand).toHaveBeenCalled();
        expect(nodesshMock.dispose).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        expect(appStateWithServerStartTime.serverStartedAt).not.toBeUndefined();
        expect(appStateWithServerStartTime.serverStoppedAt).toBeUndefined();
        done();
      });
    });

    it('should invoke SSH and generate correct response on command failure', (done) => {
      // given
      // ExecCommand KO (non 0 exit code)
      nodesshMock.execCommand.mockImplementation(() => Promise.resolve({ stdin: '', stdout: '', code: 1 }));

      // when-then
      off(undefined, res, appState).then(() => {
        expect(nodesshMock.connect).toHaveBeenCalled();
        expect(nodesshMock.execCommand).toHaveBeenCalled();
        expect(nodesshMock.dispose).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should invoke SSH and generate correct response on connect failure', (done) => {
      // given
      // Connect KO
      nodesshMock.connect.mockImplementation(() => Promise.reject());

      // when-then
      off(undefined, res, appState).then(() => {
        expect(nodesshMock.connect).toHaveBeenCalled();
        expect(nodesshMock.execCommand).not.toHaveBeenCalled();
        expect(nodesshMock.dispose).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
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
      expect(mockOnJobStart).toHaveBeenCalled();
      expect(mockOffJobStart).toHaveBeenCalled();
      expect(state.isScheduleEnabled).toEqual(true);
      expect(mockSend).toHaveBeenCalled();
      expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
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
      expect(mockOnJobStop).toHaveBeenCalled();
      expect(mockOffJobStop).toHaveBeenCalled();
      expect(state.isScheduleEnabled).toEqual(false);
      expect(mockSend).toHaveBeenCalled();
      expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('logs function', () => {
    it('should return 204 if no log file', (done) => {
      // given
      appRootDirMock.get.mockImplementationOnce(() => '/foo/bar');

      // when-then
      logs(undefined, res).then(() => {
        expect(mockStatus).toHaveBeenCalledWith(204);
        expect(mockSend).toHaveBeenCalledWith(undefined);
        done();
      });
    });

    it('should generate correct response with log file', (done) => {
      // given-when-then
      logs(undefined, res).then(() => {
        expect(mockSend).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });
  });
});
