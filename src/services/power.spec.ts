import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { generateDefaultResponse } from '../helpers/testing';
import { off, on } from './power';

const { expressResponseMock, nodeFSMock, nodesshMock, wakeonlanMock } = globalMocks;

const appState = {
  isScheduleEnabled: true,
  startedAt: new Date('June 12, 2018 13:14:00Z'),
};

const res = generateDefaultResponse(expressResponseMock);

describe('power services', () => {
  describe('on service', () => {
    beforeEach(() => {
      resetMocks();

      // WOL OK
      wakeonlanMock.wake.mockImplementation((a, o, f) => {
        f();
      });

      expressResponseMock.statusMock.mockImplementation(() => expressResponseMock);
    });

    it('should invoke wol and generate correct response on success', () => {
      // given
      const appStateWithServerStopTime = {
        ...appState,
        serverStartedAt: null,
        serverStoppedAt: new Date(),
      };

      // when
      on(undefined, res, appStateWithServerStopTime);

      // then
      expect(wakeonlanMock.wake).toHaveBeenCalled();
      expect(wakeonlanMock.wake.mock.calls[0][0]).toEqual('FF:FF:FF:FF:FF:FF:FF:FF');
      expect(wakeonlanMock.wake.mock.calls[0][1]).toEqual({ address: '255.255.255.255' });
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
      expect(appStateWithServerStopTime.serverStartedAt.getTime()).toEqual(1528812840000);
      expect(appStateWithServerStopTime.serverStoppedAt).toBeUndefined();
    });

    it('should not alter server start time when already defined', () => {
      // given
      const appStateWithServerStartTime = {
        ...appState,
        serverStartedAt: new Date(),
      };

      // when
      on(undefined, res, appStateWithServerStartTime);

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
      on(undefined, res, appStateWithServerStopTime);

      // then
      expect(wakeonlanMock.wake).toHaveBeenCalled();
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(500);
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
      expect(appStateWithServerStopTime.serverStartedAt).toBeUndefined();
      expect(appStateWithServerStopTime.serverStoppedAt).not.toBeUndefined();
    });
  });

  describe('off service', () => {
    beforeEach(() => {
      resetMocks();

      // Async file reader OK with private key contents
      nodeFSMock.readFile.mockResolvedValue('=== PRIVATE KEY ===');

      expressResponseMock.statusMock.mockImplementation(() => expressResponseMock);

      nodesshMock.execCommand.mockResolvedValue({ stdout: '', stderr: '', code: 0 });
    });

    it('should invoke SSH and generate correct response on success', async () => {
      // given
      const appStateWithServerStartTime = {
        ...appState,
        serverStartedAt: new Date(),
        serverStoppedAt: undefined,
      };

      // when
      await off(undefined, res, appStateWithServerStartTime);

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
      expect(appStateWithServerStartTime.serverStartedAt).toBeUndefined();
      expect(appStateWithServerStartTime.serverStoppedAt.getTime()).toEqual(1528812840000);
    });

    it('should not alter server stop time when already defined', async () => {
      // given
      const appStateWithServerStopTime = {
        ...appState,
        serverStoppedAt: new Date(),
      };

      // when
      await off(undefined, res, appStateWithServerStopTime);

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
      await off(undefined, res, appStateWithServerStartTime);

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
      await off(undefined, res, appState);

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
      await off(undefined, res, appState);

      // then
      expect(nodesshMock.connect).toHaveBeenCalled();
      expect(nodesshMock.execCommand).not.toHaveBeenCalled();
      expect(nodesshMock.dispose).toHaveBeenCalled();
      expect(expressResponseMock.statusMock).toHaveBeenCalledWith(500);
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });
  });
});
