import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { generateDefaultResponse } from '../helpers/testing';
import ping from './ping';

jest.mock('../helpers/systemGateway', () => globalMocks.systemGatewayMock);

const {
  axiosMock, expressResponseMock, nodeFSMock, systemGatewayMock: mockSystemGateway, nodesshMock,
} = globalMocks;

const appState = {
  isScheduleEnabled: true,
  startedAt: new Date('June 12, 2018 13:14:00Z'),
};

const res = generateDefaultResponse(expressResponseMock);

describe('ping service', () => {
  beforeEach(() => {
    resetMocks();

    // Ping OK
    mockSystemGateway.pingMock.mockResolvedValue(true);

    // HTTP OK
    axiosMock.get.mockImplementation(() => Promise.resolve());

    // Async file reader OK with private key contents
    nodeFSMock.readFile.mockResolvedValue('=== PRIVATE KEY ===');
  });

  it('should perform diagnosis and send appropriate response when schedule enabled', async () => {
    // given
    const state = {
      ...appState,
    };

    // when
    await ping({}, expressResponseMock, state);

    // then
    expect(mockSystemGateway.pingMock).toHaveBeenCalled();
    expect(mockSystemGateway.pingMock.mock.calls[0][0]).toEqual('Host Name');
    expect(nodesshMock.connect).toHaveBeenCalledWith({
      host: 'Host Name',
      port: 22,
      privateKey: '=== PRIVATE KEY ===',
      username: 'User',
    });
    expect(nodesshMock.dispose).toHaveBeenCalled();
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });

  it('should send appropriate response when serverStartedAt defined', async () => {
    // given
    const state = {
      ...appState,
      serverStartedAt: new Date(Date.now()),
    };

    // when
    await ping({}, expressResponseMock, state);

    // then
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });

  it('should send appropriate response when serverStoppedAt defined', async () => {
    // given
    const state = {
      ...appState,
      serverStoppedAt: new Date(Date.now()),
    };

    // when
    await ping({}, expressResponseMock, state);

    // then
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });

  it('should send appropriate response when server ping KO', async () => {
    // given
    const state = {
      ...appState,
    };
      // Ping KO
    mockSystemGateway.pingMock.mockResolvedValue(false);

    // when
    await ping({}, expressResponseMock, state);

    // then
    expect(mockSystemGateway.pingMock).toHaveBeenCalled();
    expect(nodesshMock.connect).toHaveBeenCalled();
    expect(nodesshMock.dispose).toHaveBeenCalled();
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });

  it('should send appropriate response when server SSH KO', async () => {
    // given
    const state = {
      ...appState,
    };
      // SSH KO
    nodesshMock.connect.mockImplementation(() => Promise.reject());

    // when
    await ping({}, expressResponseMock, state);

    // then
    expect(mockSystemGateway.pingMock).toHaveBeenCalled();
    expect(nodesshMock.connect).toHaveBeenCalled();
    expect(nodesshMock.dispose).toHaveBeenCalled();
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });

  it('should send appropriate response when server HTTP KO', async () => {
    // given
    const state = {
      ...appState,
    };
      // HTTP KO
    axiosMock.get.mockImplementation(() => Promise.reject());

    // when
    await ping({}, res, state);

    // then
    expect(mockSystemGateway.pingMock).toHaveBeenCalled();
    expect(nodesshMock.connect).toHaveBeenCalled();
    expect(axiosMock.get).toHaveBeenCalledWith('http://localhost');
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });

  it('should send appropriate response when server OFFLINE', async () => {
    // given
    const state = {
      ...appState,
    };
      // Ping KO
    mockSystemGateway.pingMock.mockImplementation(() => Promise.resolve(false));
    // SSH KO
    nodesshMock.connect.mockImplementation(() => Promise.reject());
    // HTTP KO
    axiosMock.get.mockImplementation(() => Promise.reject());

    // when-then
    await ping({}, res, state);

    // then
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });

  it('should send appropriate response when schedule disabled', async () => {
    // given
    const state = {
      ...appState,
      isScheduleEnabled: false,
    };

    // when
    await ping({}, res, state);

    // then
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });
});