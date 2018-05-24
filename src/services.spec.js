const { ping } = require('./services');

const mockSend = jest.fn();

describe('services functions', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  const appState = {
    isScheduleEnabled: false,
  };

  const res = {
    send: msg => mockSend(msg),
  };

  describe('ping function', () => {
    it('should send appropriate response when schedule enabled', () => {
      // given
      const state = {
        ...appState,
        isScheduleEnabled: true,
      };
      
      // when
      ping({}, res, state);

      // then
      expect(mockSend).toHaveBeenCalled();
      expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should send appropriate response when schedule disabled', () => {
      // given
      const state = {
        ...appState,
      };
      
      // when
      ping({}, res, state);

      // then
      expect(mockSend).toHaveBeenCalled();
      expect(mockSend.mock.calls[0][0]).toMatchSnapshot();
    });
  });
});
