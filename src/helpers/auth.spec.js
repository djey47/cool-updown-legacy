const { initBasicAuth } = require('./auth');

const mockBasicAuthPlugin = jest.fn();
const mockApp = {
  use: plugin => (plugin),
};
jest.mock('express-basic-auth', () =>
  settings => mockBasicAuthPlugin(settings));

describe('authentication helper functions', () => {
  beforeEach(() => {
    mockBasicAuthPlugin.mockReset();
  });

  describe('initBasicAuth function', () => {
    it('should do nothing when disabled', () => {
      // given-when
      initBasicAuth(mockApp, false);

      // then
      expect(mockBasicAuthPlugin).not.toHaveBeenCalled();
    });

    it('should invoke plugin when enabled', () => {
      // given-when
      initBasicAuth(mockApp, true, 'user', 'password');

      // then
      expect(mockBasicAuthPlugin).toHaveBeenCalledWith({
        users: {
          user: 'password',
        },
        challenge: true,
        realm: 'NyDGMFeptk',
      });
    });
  });
});
