const mockWinstonLogger = jest.fn();
const mockWinstonTransport = jest.fn();
jest.mock('winston', () => ({
  Logger: mockWinstonLogger,
  transports: {
    Console: mockWinstonTransport,
    File: mockWinstonTransport,
  },
}));

// TODO set global mock
jest.mock('app-root-dir', () => ({
  get: () => './test',
}));

const mockShellMkdir = jest.fn();
jest.mock('shelljs', () => ({
  mkdir: (o, p) => mockShellMkdir(o, p),
}));

beforeEach(() => {
  mockShellMkdir.mockReset();
  mockWinstonLogger.mockReset();
  mockWinstonTransport.mockClear();
});

describe('default logger', () => {
  it('should create logs directory and Winston Logger instance', () => {
    // given-when
    require('./logger'); // eslint-disable-line

    // then
    expect(mockShellMkdir).toHaveBeenCalledWith('-p', 'test/logs');

    expect(mockWinstonLogger).toHaveBeenCalledWith({
      handleExceptions: false,
      level: 'info',
      transports: [{}, {}],
    });

    expect(mockWinstonTransport).toHaveBeenCalledTimes(2);
    expect(mockWinstonTransport).toHaveBeenCalledWith({ timestamp: true });
    expect(mockWinstonTransport).toHaveBeenCalledWith({ filename: 'test/logs/app.log', json: false });
  });
});
