import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { generateDefaultResponse } from '../helpers/testing';
import logs from './logs';

jest.mock('../helpers/page', () => globalMocks.pageMock);

const {
  appRootDirMock, expressResponseMock, nodeFSMock, pageMock
} = globalMocks;

const res = generateDefaultResponse(expressResponseMock);

describe('logs service', () => {
  beforeEach(() => {
    resetMocks();

    expressResponseMock.statusMock.mockImplementation(() => expressResponseMock);

    // Page helper
    pageMock.generatePage.mockImplementation((html) => `<page-shared />${html}`);
  });

  it('should return 500 if no log file', async () => {
    // given
    nodeFSMock.readFile.mockRejectedValue('file not found');
    appRootDirMock.get.mockImplementationOnce(() => '/foo/bar');

    // when
    await logs(undefined, res);

    // then
    expect(expressResponseMock.statusMock).toHaveBeenCalledWith(500);
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });

  it('should generate correct response with log file', async () => {
    // given
    const contents = 'These are logs contents';
    nodeFSMock.stat.mockResolvedValue({ size: contents.length })
    nodeFSMock.readFile.mockResolvedValue(contents);

    // when
    await logs(undefined, res);

    // then
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });
});
