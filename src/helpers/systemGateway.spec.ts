import resetMocks from '../../config/jest/resetMocks';
import globalMocks from '../../config/jest/globalMocks';
import { ping } from './systemGateway';
import { FeatureStatus } from '../model/models';

const { nodeChildProcessMock } = globalMocks;

describe('systemGateway helper functions', () => {
  describe('ping', () => {
    beforeEach(() => {
      resetMocks();
    });

    it('should create child process with command and callback, for ping success', async () => {
      // given
      // Force promise resolution
      nodeChildProcessMock.exec.mockImplementation((_cmd, cb) => { 
        cb();
      })

      // when
      const actualStatus = await ping('hostname');

      // then
      expect(actualStatus).toBe(FeatureStatus.OK);
      expect(nodeChildProcessMock.exec).toHaveBeenCalledWith('ping -c 2 hostname', expect.any(Function));
    });

    it('should create child process with command and callback, for ping failure', async () => {
      // given
      // Force promise resolution
      nodeChildProcessMock.exec.mockImplementation((_cmd, cb) => { 
        cb('error', undefined, 'An error has occurred');
      })

      // when
      const actualStatus = await ping('hostname');

      // then
      expect(actualStatus).toBe(FeatureStatus.KO);
      expect(nodeChildProcessMock.exec).toHaveBeenCalledWith('ping -c 2 hostname', expect.any(Function));
    });
  });
});
