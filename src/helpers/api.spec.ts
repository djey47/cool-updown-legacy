import { ApiRequest } from "../model/models";
import { extractServerIdentifier } from "./api";

describe('api helper functions', () => {
  describe('extractServerIdentifier function', () => {
    it('should return serverId from request', () => {
      // given
      const request: ApiRequest = {
        params: {
          serverId: 'server-id',
        },
      }
      
      // when -then
      expect(extractServerIdentifier(request)).toBe('server-id');
    });
  });
});
