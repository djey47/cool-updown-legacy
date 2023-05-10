import { ApiRequest } from '../model/models';
import { validateInputParameters } from './api';
import globalMocks from '../../config/jest/globalMocks';

const responseMock = globalMocks.expressResponseMock;

describe('api helper functions', () => {
  describe('validateInputParameters function', () => {
    beforeEach(() => {
      responseMock.statusMock.mockReset();
      responseMock.sendMock.mockReset();
    })

    it('should return serverId from request', () => {
      // given
      const request: ApiRequest = {
        params: {
          serverId: 'server-id',
        },
      };

      // when
      const actualParameters = validateInputParameters(request, responseMock);

      // then
      expect(actualParameters.serverId).toBe('server-id');
    });

    it('should return 400 HTTP response when missing serverId', () => {
      // given
      const request: ApiRequest = {
        params: {},
      };
      responseMock.statusMock.mockReturnValue(responseMock);

      // when
      const actualParameters = validateInputParameters(request, responseMock);

      // then
      expect(responseMock.statusMock).toHaveBeenCalledWith(400);
      expect(responseMock.sendMock).toHaveBeenCalledWith('Invalid argument specified!');
      expect(actualParameters.serverId).toBeUndefined();
    });
  });
});
