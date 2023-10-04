import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { initBasicAuth, readPrivateKey } from './auth';

const { expressBasicAuthMock, nodeFSMock } = globalMocks;

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
  
  describe('readPrivateKey asynchronous function', () => {
    beforeEach(() => {
      resetMocks();
    });

    it('should resolve to undefined when undefined key path', async () => {
      // given-when
      const actual = await readPrivateKey();

      // then
      expect(actual).toBeUndefined();
    });

    it('should read key contents from file system', async () => {
      // given
      nodeFSMock.readFile.mockResolvedValue('=== PRIVATE KEY ===');

      // when
      const actual = await readPrivateKey('/key-path');

      // then
      expect(actual).toBe('=== PRIVATE KEY ===');
      expect(nodeFSMock.readFile).toHaveBeenCalledWith('/key-path', 'utf-8');
    });
  });
});
