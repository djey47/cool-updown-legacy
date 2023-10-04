import { validateInputParameters } from './api';
import globalMocks from '../../config/jest/globalMocks';

import type { ApiRequest } from '../model/api';

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
          serverId: '0',
        },
      };

      // when
      const actualParameters = validateInputParameters(request, responseMock);

      // then
      expect(actualParameters.serverId).toBe(0);
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
