import config from 'config';
import dateFns from 'date-fns';
import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { generateDefaultAppState, generateDefaultResponse } from '../helpers/testing';
import ping from './ping';
import { readPackageConfiguration } from '../helpers/project';
import { AppConfig, AppState, FeatureStatus } from '../model/models';

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
    mockSystemGateway.pingMock.mockResolvedValue(FeatureStatus.OK);

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
    const state: AppState = {
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

  it('should send appropriate response when serverStartedAt more recent than serverStoppedAt', async () => {
    // given
    const state: AppState = {
      ...appState,
      servers: [{
        ...appState.servers[0],
        startedAt: new Date(Date.now()),
        stoppedAt: dateFns.subHours(Date.now(), 1),
      }],
    };

    // when
    await ping({}, expressResponseMock, state);

    // then
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });

  it('should send appropriate response when serverStoppedAt more recent than serverStartedAt', async () => {
    // given
    const state: AppState = {
      ...appState,
      servers: [{
        ...appState.servers[0],
        startedAt: dateFns.subHours(Date.now(), 1),
        stoppedAt: new Date(Date.now()),
      }],
    };

    // when
    await ping({}, expressResponseMock, state);

    // then
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
  });

  it('should send appropriate response when server ping KO', async () => {
    // given
    const state: AppState = {
      ...appState,
    };
    // Ping KO
    mockSystemGateway.pingMock.mockResolvedValue(FeatureStatus.KO);

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
    const state: AppState = {
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
  
  it('should send appropriate response when missing SSH configuration', async () => {
    // given
    const state: AppState = {
      ...appState,
    };
    const appConfig = config as unknown as AppConfig;
    const { servers: [serverConfig] } = appConfig; 
    const sshConfig = serverConfig.ssh;
    const sshConfigBackup = { ...sshConfig };
    delete serverConfig.ssh;

    // when
    await ping({}, expressResponseMock, state);

    // then
    expect(nodesshMock.connect).not.toHaveBeenCalled();
    expect(nodesshMock.dispose).not.toHaveBeenCalled();
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();

    serverConfig.ssh = sshConfigBackup;
  });

  it('should send appropriate response when server HTTP KO', async () => {
    // given
    const state: AppState = {
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

  it('should send appropriate response when missing HTTP URL', async () => {
    // given
    const state: AppState = {
      ...appState,
    };
    const appConfig = config as unknown as AppConfig;
    const { servers: [serverConfig] } = appConfig; 
    const serverUrlBackup = serverConfig.url;
    delete serverConfig.url;

    // when
    await ping({}, expressResponseMock, state);

    // then
    expect(axiosMock.get).not.toHaveBeenCalled();
    expect(expressResponseMock.sendMock).toHaveBeenCalled();
    expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();

    serverConfig.url = serverUrlBackup;
  });

  it('should send appropriate response when server OFFLINE', async () => {
    // given
    const state: AppState = {
      ...appState,
    };
    // Ping KO
    mockSystemGateway.pingMock.mockImplementation(() => Promise.resolve(FeatureStatus.KO));
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
