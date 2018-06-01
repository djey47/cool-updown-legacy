const { ping } = require('./services');

const mockSend = jest.fn();
const mockGatewayPing = jest.fn();
const mockSSHConnect = jest.fn();

jest.mock('node-ssh', () => jest.fn(() => ({
  connect: o => mockSSHConnect(o),
})));

jest.mock('./helpers/systemGateway', () => ({
  ping: (h, f) => mockGatewayPing(h, f),
}));

const res = {
  send: msg => mockSend(msg),
};

describe('services functions', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockGatewayPing.mockReset();
    mockSSHConnect.mockReset();

    // Ping OK
    mockGatewayPing.mockImplementation((h, f) => {
      f();
    });
  });

  const appState = {
    isScheduleEnabled: true,
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
      mockGatewayPing.mockImplementation((h, f) => {
        f({});
      });

      // when-then
      ping({}, res, state).then(() => {
        expect(mockGatewayPing).toHaveBeenCalled();
        expect(mockSSHConnect).toHaveBeenCalled();
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
      mockGatewayPing.mockImplementation((h, f) => {
        f({});
      });
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
});
