import globalMocks from '../../config/jest/globalMocks';
import resetMocks from '../../config/jest/resetMocks';
import { disable, enable } from './schedule';

const { expressResponseMock, jobsMock } = globalMocks;

const appState = {
  isScheduleEnabled: true,
  startedAt: new Date('June 12, 2018 13:14:00Z'),
};

const res = {
  status: c => expressResponseMock.statusMock(c),
  send: msg => expressResponseMock.sendMock(msg),
};

const mockJobs = {
  onJob: {
    start: () => jobsMock.onJobStart(),
    stop: () => jobsMock.onJobStop(),
  },
  offJob: {
    start: () => jobsMock.offJobStart(),
    stop: () => jobsMock.offJobStop(),
  },
};

describe('schedule services', () => {
  describe('enable service', () => {
    beforeEach(() => {
      resetMocks();
    });

    it('should set jobs state correctly and generate correct response', () => {
      // given
      const state = {
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
