import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { generateDefaultAppState, generateDefaultResponse } from '../helpers/testing';
import ping from './ping';
import { readPackageConfiguration } from '../helpers/project';
import { FeatureStatus } from '../model/models';

jest.mock('../helpers/systemGateway', () => globalMocks.systemGatewayMock);
jest.mock('../helpers/project', () => ({
  readPackageConfiguration: jest.fn(),
}));
jest.mock('../helpers/page', () => globalMocks.pageMock);
jest.mock('../helpers/ssh', () => globalMocks.sshMock);

const {
  axiosMock, expressResponseMock, systemGatewayMock: mockSystemGateway, nodesshMock, pageMock, sshMock
} = globalMocks;

const readPackageConfigurationMock = readPackageConfiguration as jest.Mock;

const appState = generateDefaultAppState();
const res = generateDefaultResponse(expressResponseMock);

describe('ping service', () => {
  beforeEach(() => {
    resetMocks();
    readPackageConfigurationMock.mockReset();

    // Ping OK
    mockSystemGateway.pingMock.mockResolvedValue(true);

    // HTTP OK
    axiosMock.get.mockImplementation(() => Promise.resolve());

    // Package config utility
    readPackageConfigurationMock.mockResolvedValue({ name: 'cud', version: 'test' });

    // Page helper
    pageMock.generatePage.mockImplementation((html, metaOptions) => `<page-shared with meta ${JSON.stringify(metaOptions)} />${html}`);

    // SSH helper
    sshMock.getSSHParameters.mockResolvedValue({
      host: 'Host Name',
      port: 22,
      privateKey: '=== PRIVATE KEY ===',
      username: 'User',
    });

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
    expect(state.servers[0].lastPingStatus).toBe(FeatureStatus.OK); 
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
    expect(state.servers[0].lastPingStatus).toBe(FeatureStatus.KO);
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
});
