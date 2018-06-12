const { expressBasicAuthMock } = require('../../config/jest/globalMocks');
const { initBasicAuth } = require('./auth');

const mockApp = {
  use: plugin => (plugin),
};

describe('authentication helper functions', () => {
  beforeEach(() => {
    expressBasicAuthMock.mockReset();
  });

  describe('initBasicAuth function', () => {
    it('should do nothing when disabled', () => {
      // given-when
      initBasicAuth(mockApp, false);

      // then
      expect(expressBasicAuthMock).not.toHaveBeenCalled();
    });

    it('should invoke plugin when enabled', () => {
      // given-when
      initBasicAuth(mockApp, true, 'user', 'password');

      // then
      expect(expressBasicAuthMock).toHaveBeenCalledWith({
        users: {
          user: 'password',
        },
        challenge: true,
        realm: 'NyDGMFeptk',
      });
    });
  });
});
