import config from 'config';
import globalMocks from '../../config/jest/globalMocks';
import { retrieveServerConfiguration } from './config';
import { ServerConfig } from '../model/models';

const responseMock = globalMocks.expressResponseMock;

describe('configuration helper functions', () => {
  describe('retrieveServerConfiguration function', () => {
    beforeEach(() => {
      responseMock.statusMock.mockReset();
      responseMock.sendMock.mockReset();
    });

    it('should return proper server config', () => {
      // given-when
      const actualConfig = retrieveServerConfiguration(responseMock, 0);

      // then
      const [expectedConfig] = config.get('servers') as ServerConfig[];
      expect(actualConfig).toEqual(expectedConfig);
    });    
    
    it('should send a HTTP 400 when no config found', () => {
      // given
      responseMock.statusMock.mockReturnValue(responseMock);

      // when
      const actualConfig = retrieveServerConfiguration(responseMock, 1);

      // then
      expect(responseMock.statusMock).toHaveBeenCalledWith(400);
      expect(responseMock.sendMock).toHaveBeenCalledWith('Invalid argument specified!');
      expect(actualConfig).toBeUndefined();
    });
  });
});
