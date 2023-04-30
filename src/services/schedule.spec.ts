import { CronJob } from 'cron';
import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { generateDefaultAppState, generateDefaultResponse } from '../helpers/testing';
import { AppState } from '../model/models';
import { disable, enable } from './schedule';

const { expressResponseMock, jobsMock } = globalMocks;

const appState = generateDefaultAppState();
const res = generateDefaultResponse(expressResponseMock);

const mockJobs = {
  onJob: createJobMock(jobsMock.onJobStart, jobsMock.onJobStop),
  offJob: createJobMock(jobsMock.offJobStart, jobsMock.offJobStop),
};

describe('schedule services', () => {
  describe('enable service', () => {
    beforeEach(() => {
      resetMocks();
    });

    it('should set jobs state correctly and generate correct response', () => {
      // given
      const state: AppState = {
        ...appState,
        ...mockJobs,
        isScheduleEnabled: false,
      };

      // when
      enable(undefined, res, state);

      // then
      expect(jobsMock.onJobStart).toHaveBeenCalled();
      expect(jobsMock.offJobStart).toHaveBeenCalled();
      expect(state.isScheduleEnabled).toEqual(true);
      expect(expressResponseMock.sendMock).toHaveBeenCalled();
      expect(expressResponseMock.sendMock.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('disable service', () => {
    beforeEach(() => {
      resetMocks();
    });

    it('should set jobs state correctly and generate correct response', () => {
      // given
      const state = {
        ...appState,
        ...mockJobs,
        isScheduleEnabled: true,
      };

      // when
      disable(undefined, res, state);

      // then
      expect(jobsMock.onJobStop).toHaveBeenCalled();
      expect(jobsMock.offJobStop).toHaveBeenCalled();
      expect(state.isScheduleEnabled).toEqual(false);
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
