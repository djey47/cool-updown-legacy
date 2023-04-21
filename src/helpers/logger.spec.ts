import globalMocks from '../../config/jest/globalMocks';
const { winstonMock, shelljsMock } = globalMocks;

beforeEach(() => {
  shelljsMock.mkdir.mockReset();
  winstonMock.Logger.mockReset();
  winstonMock.Transport.mockClear();
});

describe('default logger', () => {
  it('should create logs directory and Winston Logger instance', () => {
    // given-when
    require('./logger'); // eslint-disable-line global-require

    // then
    expect(shelljsMock.mkdir.mock.calls[0][0]).toEqual('-p');
    expect(shelljsMock.mkdir.mock.calls[0][1].replace('\\', '/')).toEqual('test/logs');

    expect(winstonMock.Logger).toHaveBeenCalledWith({
      handleExceptions: false,
      level: 'info',
      transports: [{}, {}],
    });

    expect(winstonMock.Transport).toHaveBeenCalledTimes(2);
    expect(winstonMock.Transport).toHaveBeenCalledWith({ timestamp: true });
    const [, [{ filename, json }]] = winstonMock.Transport.mock.calls;
    expect(filename.replace(/\\/g, '/')).toEqual('test/logs/app.log');
    expect(json).toBe(false);
  });
});
