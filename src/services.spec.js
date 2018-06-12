const { appRootDirMock, nodesshMock, wakeonlanMock } = require('../config/jest/globalMocks');
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
    // appRootDirMock.get.mockReset();
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

    mockStatus.mockImplementation(() => res);

    nodesshMock.execCommand.mockImplementation(() => Promise.resolve({ stdout: '', stderr: '', code: 0 }));
  });

  const appState = {
    isScheduleEnabled: true,
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
      // given-when
      on(undefined, res);

      // then
      expect(wakeonlanMock.wake).toHaveBeenCalled();
      expect(wakeonlanMock.wake.mock.calls[0][0]).toEqual('FF:FF:FF:FF:FF:FF:FF:FF');
      expect(wakeonlanMock.wake.mock.calls[0][1]).toEqual({ address: '255.255.255.255' });
      expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should invoke wol and generate correct response on failure', () => {
      // given
      // WOL KO
      wakeonlanMock.wake.mockImplementation((a, o, f) => {
        f({});
      });

      // when
      on(undefined, res);

      // then
      expect(wakeonlanMock.wake).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('off function', () => {
    it('should invoke SSH and generate correct response on success', (done) => {
      // given-when-then
      off(undefined, res).then(() => {
        expect(nodesshMock.connect).toHaveBeenCalledWith({
          host: 'Host Name',
          port: 22,
          privateKey: 'Key Path',
          username: 'User',
        });
        expect(nodesshMock.execCommand).toHaveBeenCalledWith('OFF Command');
        expect(nodesshMock.dispose).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should invoke SSH and generate correct response on failure (promise rejection)', (done) => {
      // given
      // ExecCommand KO (rejection)
      nodesshMock.execCommand.mockImplementation(() => Promise.reject());

      // when-then
      off(undefined, res).then(() => {
        expect(nodesshMock.connect).toHaveBeenCalled();
        expect(nodesshMock.execCommand).toHaveBeenCalled();
        expect(nodesshMock.dispose).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should invoke SSH and generate correct response on command failure', (done) => {
      // given
      // ExecCommand KO (non 0 exit code)
      nodesshMock.execCommand.mockImplementation(() => Promise.resolve({ stdin: '', stdout: '', code: 1 }));

      // when-then
      off(undefined, res).then(() => {
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
      off(undefined, res).then(() => {
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
