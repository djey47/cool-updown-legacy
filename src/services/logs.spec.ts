import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { generateDefaultResponse } from '../helpers/testing';
import logs from './logs';

const {
  appRootDirMock, expressResponseMock, nodeFSMock,
} = globalMocks;

const res = generateDefaultResponse(expressResponseMock);

describe('logs service', () => {
  beforeEach(() => {
    resetMocks();

    // Async file reader OK with log contents
    nodeFSMock.readFile.mockResolvedValue('These are logs contents');

    expressResponseMock.statusMock.mockImplementation(() => expressResponseMock);
  });

  it('should return 204 if no log file', async () => {
    // given
    nodeFSMock.readFile.mockRejectedValue('file not found');
    appRootDirMock.get.mockImplementationOnce(() => '/foo/bar');

    // when
    await logs(undefined, res);

    // then
    expect(expressResponseMock.statusMock).toHaveBeenCalledWith(204);
    expect(expressResponseMock.sendMock).toHaveBeenCalledWith(undefined);
  });

  it('should generate correct response with log file', async () => {
    // given-when
    await logs(undefined, res);

    // then
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });
});
