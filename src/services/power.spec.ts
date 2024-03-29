import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { generateDefaultAppState, generateDefaultRequest, generateDefaultResponse } from '../helpers/testing';
import { offServer, onServer } from './power';
import { FeatureStatus } from '../model/models';

import type { AppState } from '../model/models';

jest.mock('../helpers/page', () => globalMocks.pageMock);
jest.mock('../helpers/ssh', () => globalMocks.sshMock);

const { expressResponseMock, nodesshMock, wakeonlanMock, pageMock, sshMock } = globalMocks;

const appState = generateDefaultAppState();
const res = generateDefaultResponse(expressResponseMock);
const req = generateDefaultRequest({ serverId: '0' });

describe('power services', () => {
  describe('on service for single server', () => {
    beforeEach(() => {
      resetMocks();

      // WOL OK
      wakeonlanMock.wake.mockImplementation((a, o, f) => {
        f();
      });

      expressResponseMock.statusMock.mockImplementation(() => expressResponseMock);

      // Page helper
      pageMock.generatePage.mockImplementation((html) => `<page-shared />${html}`);
    });

    it('should not wake server if last ping state for this server is already OK', () => {
      // given
      const appStateWithServerPingOK: AppState = {
        ...appState,
        servers: [{
          lastPingStatus: FeatureStatus.OK,
        }],
      };

      // when
      onServer(req, res, appStateWithServerPingOK);

      // then
      expect(wakeonlanMock.wake).not.toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should invoke wol and generate correct response on success', () => {
      // given
      const appStateWithServerStopTime: AppState = {
        ...appState,
        servers: [{
          startedAt: null,
          stoppedAt: new Date(),
          lastPingStatus: FeatureStatus.UNAVAILABLE,  
        }],
      };

      // when
      onServer(req, res, appStateWithServerStopTime);

      // then
      expect(wakeonlanMock.wake).toHaveBeenCalled();
      expect(wakeonlanMock.wake.mock.calls[0][0]).toEqual('FF:FF:FF:FF:FF:FF');
      expect(wakeonlanMock.wake.mock.calls[0][1]).toEqual({ address: '255.255.255.255' });
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
      expect(appStateWithServerStopTime.servers[0].startedAt.getTime()).toEqual(1528812840000);
    });

    it('should not alter server start time when already defined', () => {
      // given
      const appStateWithServerStartTime = {
        ...appState,
        serverStartedAt: new Date(),
      };

      // when
      onServer(req, res, appStateWithServerStartTime);

      // then
      expect(appStateWithServerStartTime.serverStartedAt).toBeDefined();
      expect(appStateWithServerStartTime.serverStartedAt.getTime()).not.toEqual(1528812840000);
    });

    it('should invoke wol and generate correct response on failure', () => {
      // given
      // WOL KO
      wakeonlanMock.wake.mockImplementation((a, o, f) => {
        f({});
      });
      const appStateWithServerStopTime = {
        ...appState,
        serverStartedAt: undefined,
        serverStoppedAt: new Date(),
      };

      // when
      onServer(req, res, appStateWithServerStopTime);

      // then
      expect(wakeonlanMock.wake).toHaveBeenCalled();
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(500);
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
      expect(appStateWithServerStopTime.serverStartedAt).toBeUndefined();
      expect(appStateWithServerStopTime.serverStoppedAt).not.toBeUndefined();
    });
  });

  describe('off service for single server', () => {
    beforeEach(() => {
      resetMocks();

      expressResponseMock.statusMock.mockImplementation(() => expressResponseMock);

      nodesshMock.connect.mockResolvedValue(undefined);
      nodesshMock.execCommand.mockResolvedValue({ stdout: '', stderr: '', code: 0 });

      // Page helper
      pageMock.generatePage.mockImplementation((html) => `<page-shared />${html}`);
    
      // SSH helper
      sshMock.getSSHParameters.mockResolvedValue({
        host: 'Host Name',
        port: 22,
        privateKey: '=== PRIVATE KEY ===',
        username: 'User',
       });
    });

    it('should not connect to server if last ping state for this server is already KO', () => {
      // given
      const appStateWithServerPingKO: AppState = {
        ...appState,
        servers: [{
          lastPingStatus: FeatureStatus.KO,
        }],
      };

      // when
      offServer(req, res, appStateWithServerPingKO);

      // then
      expect(nodesshMock.execCommand).not.toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should invoke SSH and generate correct response on success', async () => {
      // given
      const appStateWithServerStartTime: AppState = {
        ...appState,
        servers: [{
          startedAt: new Date(),
          stoppedAt: undefined,
          lastPingStatus: FeatureStatus.UNAVAILABLE,
        }],
      };

      // when
      await offServer(req, res, appStateWithServerStartTime);

      // then
      expect(nodesshMock.connect).toHaveBeenCalledWith({
        host: 'Host Name',
        port: 22,
        privateKey: '=== PRIVATE KEY ===',
        username: 'User',
      });
      expect(nodesshMock.execCommand).toHaveBeenCalledWith('OFF Command');
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
      expect(appStateWithServerStartTime.servers[0].stoppedAt.getTime()).toEqual(1528812840000);
    });

    it('should not alter server stop time when already defined', async () => {
      // given
      const appStateWithServerStopTime = {
        ...appState,
        serverStoppedAt: new Date(),
      };

      // when
      await offServer(req, res, appStateWithServerStopTime);

      // then
      expect(appStateWithServerStopTime.serverStoppedAt).toBeDefined();
      expect(appStateWithServerStopTime.serverStoppedAt.getTime()).not.toEqual(1528812840000);
    });

    it('should invoke SSH and generate correct response on failure (promise rejection)', async () => {
      // given
      // ExecCommand KO (rejection)
      nodesshMock.execCommand.mockImplementation(() => Promise.reject());
      const appStateWithServerStartTime = {
        ...appState,
        serverStartedAt: new Date(),
        serverStoppedAt: null,
      };

      // when
      await offServer(req, res, appStateWithServerStartTime);

      // then
      expect(nodesshMock.connect).toHaveBeenCalled();
      expect(nodesshMock.execCommand).toHaveBeenCalled();
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(500);
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
      expect(appStateWithServerStartTime.serverStartedAt).not.toBeUndefined();
      expect(appStateWithServerStartTime.serverStoppedAt).toBeNull();
    });

    it('should invoke SSH and generate correct response on command failure', async () => {
      // given
      // ExecCommand KO (non 0 exit code)
      nodesshMock.execCommand.mockImplementation(() => Promise.resolve({ stdin: '', stdout: '', code: 1 }));

      // when
      await offServer(req, res, appState);

      // then
      expect(nodesshMock.connect).toHaveBeenCalled();
      expect(nodesshMock.execCommand).toHaveBeenCalled();
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(500);
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });

    it('should invoke SSH and generate correct response on connect failure', async () => {
      // given
      // Connect KO
      nodesshMock.connect.mockImplementation(() => Promise.reject());

      // when
      await offServer(req, res, appState);

      // then
      expect(nodesshMock.connect).toHaveBeenCalled();
      expect(nodesshMock.execCommand).not.toHaveBeenCalled();
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(500);
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });
  });
});
