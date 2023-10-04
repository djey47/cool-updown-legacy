import { CronJob } from 'cron';
import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { generateDefaultAppState, generateDefaultRequest, generateDefaultResponse } from '../helpers/testing';
import { AppState, FeatureStatus } from '../model/models';
import { disableServer, enableServer } from './schedule';

jest.mock('../helpers/page', () => globalMocks.pageMock);

const { expressResponseMock, jobsMock, pageMock } = globalMocks;

const appState = generateDefaultAppState();
const res = generateDefaultResponse(expressResponseMock);
const req = generateDefaultRequest({ serverId: '0' });

const mockJobs = {
  onJob: createJobMock(jobsMock.onJobStart, jobsMock.onJobStop),
  offJob: createJobMock(jobsMock.offJobStart, jobsMock.offJobStop),
};

describe('schedule services', () => {
  describe('enable service for single server', () => {
    beforeEach(() => {
      resetMocks();

      // Page helper
      pageMock.generatePage.mockImplementation((html) => `<page-shared />${html}`);
    });

    it('should set jobs state correctly and generate correct response', () => {
      // given
      const state: AppState = {
        ...appState,
        servers: [{
          isScheduleEnabled: false,
          lastPingStatus: FeatureStatus.UNAVAILABLE,
          ...mockJobs,
        }],
      };

      // when
      enableServer(req, res, state);

      // then
      expect(jobsMock.onJobStart).toHaveBeenCalled();
      expect(jobsMock.offJobStart).toHaveBeenCalled();
      expect(state.servers[0].isScheduleEnabled).toBe(true);
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('disable service for single server', () => {
    beforeEach(() => {
      resetMocks();

      // Page helper
      pageMock.generatePage.mockImplementation((html) => `<page-shared />${html}`);
    });

    it('should set jobs state correctly and generate correct response', () => {
      // given
      const state: AppState = {
        ...appState,
        servers: [{
          isScheduleEnabled: true,
          lastPingStatus: FeatureStatus.UNAVAILABLE,
          ...mockJobs,
        }],
      };

      // when
      disableServer(req, res, state);

      // then
      expect(jobsMock.onJobStop).toHaveBeenCalled();
      expect(jobsMock.offJobStop).toHaveBeenCalled();
      expect(state.servers[0].isScheduleEnabled).toBe(false);
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });
  });
});

function createJobMock(startMock: jest.Mock, stopMock: jest.Mock): CronJob {
  return {
    addCallback: jest.fn(),
    fireOnTick: jest.fn(),
    lastDate: jest.fn(),
    nextDate: jest.fn(),
    nextDates: jest.fn(),
    running: false,
    setTime: jest.fn(),
    start: () => startMock(),
    stop: () => stopMock(),
  };
}
