import globalMocks from '../../config/jest/globalMocks';
import { initBasicAuth } from './auth';

const { expressBasicAuthMock } = globalMocks;

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
      initBasicAuth(mockApp, false, 'user', 'password');

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
