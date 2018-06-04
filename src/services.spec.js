const {
  ping,
  on,
  off,
  enableSchedule,
  disableSchedule,
} = require('./services');

const mockSend = jest.fn();
const mockStatus = jest.fn();
const mockGatewayPing = jest.fn();
const mockSSHConnect = jest.fn();
const mockSSHExecCommand = jest.fn();
const mockSSHDispose = jest.fn();
const mockWOLWake = jest.fn();
const mockOnJobStart = jest.fn();
const mockOffJobStart = jest.fn();
const mockOnJobStop = jest.fn();
const mockOffJobStop = jest.fn();

jest.mock('wake_on_lan', () => ({
  wake: (a, o, f) => mockWOLWake(a, o, f),
}));

jest.mock('node-ssh', () => jest.fn(() => ({
  connect: o => mockSSHConnect(o),
  execCommand: c => mockSSHExecCommand(c),
  dispose: () => mockSSHDispose(),
})));

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
    mockSSHConnect.mockReset();
    mockSSHExecCommand.mockReset();
    mockSSHDispose.mockReset();
    mockWOLWake.mockReset();
    mockOnJobStart.mockReset();
    mockOffJobStart.mockReset();
    mockOnJobStop.mockReset();
    mockOffJobStop.mockReset();

    // Ping OK
    mockGatewayPing.mockImplementation(() => Promise.resolve(true));

    // WOL OK
    mockWOLWake.mockImplementation((a, o, f) => {
      f();
    });

    mockStatus.mockImplementation(() => res);

    mockSSHExecCommand.mockImplementation(() => Promise.resolve({ stdout: '', stderr: '', code: 0 }));
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
        expect(mockSSHConnect).toHaveBeenCalledWith({
          host: 'Host Name',
          port: 22,
          privateKey: 'Key Path',
          username: 'User',
        });
        expect(mockSSHDispose).toHaveBeenCalled();
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
        expect(mockSSHConnect).toHaveBeenCalled();
        expect(mockSSHDispose).toHaveBeenCalled();
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
      mockSSHConnect.mockImplementation(() => Promise.reject());

      // when-then
      ping({}, res, state).then(() => {
        expect(mockGatewayPing).toHaveBeenCalled();
        expect(mockSSHConnect).toHaveBeenCalled();
        expect(mockSSHDispose).toHaveBeenCalled();
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
      mockSSHConnect.mockImplementation(() => Promise.reject());

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
      expect(mockWOLWake).toHaveBeenCalled();
      expect(mockWOLWake.mock.calls[0][0]).toEqual('FF:FF:FF:FF:FF:FF:FF:FF');
      expect(mockWOLWake.mock.calls[0][1]).toEqual({ address: '255.255.255.255' });
      expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should invoke wol and generate correct response on failure', () => {
      // given
      // WOL KO
      mockWOLWake.mockImplementation((a, o, f) => {
        f({});
      });

      // when
      on(undefined, res);

      // then
      expect(mockWOLWake).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('off function', () => {
    it('should invoke SSH and generate correct response on success', (done) => {
      // given-when-then
      off(undefined, res).then(() => {
        expect(mockSSHConnect).toHaveBeenCalledWith({
          host: 'Host Name',
          port: 22,
          privateKey: 'Key Path',
          username: 'User',
        });
        expect(mockSSHExecCommand).toHaveBeenCalledWith('OFF Command');
        expect(mockSSHDispose).toHaveBeenCalled();
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should invoke SSH and generate correct response on failure (promise rejection)', (done) => {
      // given
      // ExecCommand KO (rejection)
      mockSSHExecCommand.mockImplementation(() => Promise.reject());

      // when-then
      off(undefined, res).then(() => {
        expect(mockSSHConnect).toHaveBeenCalled();
        expect(mockSSHExecCommand).toHaveBeenCalled();
        expect(mockSSHDispose).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should invoke SSH and generate correct response on command failure', (done) => {
      // given
      // ExecCommand KO (non 0 exit code)
      mockSSHExecCommand.mockImplementation(() => Promise.resolve({ stdin: '', stdout: '', code: 1 }));

      // when-then
      off(undefined, res).then(() => {
        expect(mockSSHConnect).toHaveBeenCalled();
        expect(mockSSHExecCommand).toHaveBeenCalled();
        expect(mockSSHDispose).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
        done();
      });
    });

    it('should invoke SSH and generate correct response on connect failure', (done) => {
      // given
      // Connect KO
      mockSSHConnect.mockImplementation(() => Promise.reject());

      // when-then
      off(undefined, res).then(() => {
        expect(mockSSHConnect).toHaveBeenCalled();
        expect(mockSSHExecCommand).not.toHaveBeenCalled();
        expect(mockSSHDispose).toHaveBeenCalled();
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
});
