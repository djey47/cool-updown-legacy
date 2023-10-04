import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { ServerConfig } from '../model/models';
import { getSSHParameters } from './ssh';

jest.mock('./auth', () => globalMocks.authMock);

const { authMock } = globalMocks;

describe('SSH support functions', () => {
  describe('getSSHParameters function', () => {
    const defaultServerConfig: ServerConfig = {
      ssh: {
        keyPath: '/key-path',
        user: 'user',
      },
      network: {
        broadcastIpAddress: '255.255.255.255',
        hostname: 'hostname',
        macAddress: 'AA:BB:CC:DD:EE:FF',
      },  
    };

    beforeEach(() => {
      resetMocks();
    });

    it('should return right connection params', async () => {
      // given
      authMock.readPrivateKey.mockResolvedValue('=== PRIVATE KEY ===');

      // when
      const actual = await getSSHParameters({ ...defaultServerConfig });

      // then
      expect(actual).toEqual({
        host: 'hostname',
        privateKey: '=== PRIVATE KEY ===',
        username: 'user',
      });
    });    
    
    it('should handle no SSH and Network configuration sections', async () => {
      // given
      const config: ServerConfig = {
        ...defaultServerConfig,
        ssh: undefined,
        network: undefined,
      };

      // when
      const actual = await getSSHParameters(config);

      // then
      expect(actual).toEqual({});
    });    
  });
});
