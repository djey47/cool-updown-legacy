const { winstonMock, shelljsMock } = require('../../config/jest/globalMocks');

beforeEach(() => {
  shelljsMock.mkdir.mockReset();
  winstonMock.Logger.mockReset();
  winstonMock.Transport.mockClear();
});

describe('default logger', () => {
  it('should create logs directory and Winston Logger instance', () => {
    // given-when
    require('./logger'); // eslint-disable-line

    // then
    expect(shelljsMock.mkdir).toHaveBeenCalledWith('-p', 'test/logs');

    expect(winstonMock.Logger).toHaveBeenCalledWith({
      handleExceptions: false,
      level: 'info',
      transports: [{}, {}],
    });

    expect(winstonMock.Transport).toHaveBeenCalledTimes(2);
    expect(winstonMock.Transport).toHaveBeenCalledWith({ timestamp: true });
    expect(winstonMock.Transport).toHaveBeenCalledWith({ filename: 'test/logs/app.log', json: false });
  });
});
