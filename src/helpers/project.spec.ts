import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { readPackageConfiguration } from './project';

const { appRootDirMock, nodeFSMock } = globalMocks;

describe('project helper functions', () => {
  describe('readPackageConfiguration', () => {
    beforeEach(() => {
      resetMocks();
    })
    
    it('should return contents from package.json file', async () => {
      // given
      appRootDirMock.get.mockImplementation(() => '/app');
      nodeFSMock.readFile.mockResolvedValue('{ "name": "name" }');

      // when
      const actualConfig = await readPackageConfiguration();

      // then
      expect(nodeFSMock.readFile).toHaveBeenCalledWith(expect.stringMatching(/[/,\\]app[/,\\]package\.json/), 'utf-8');
      expect(actualConfig).toEqual({ name: 'name' });
    });
  });
});
