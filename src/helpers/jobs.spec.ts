import globalMocks from '../../config/jest/globalMocks';
import { createOnJob, createOffJob, toCronSyntax } from './jobs';
import { generateDefaultAppState } from './testing';

const { cronMock } = globalMocks;

describe('jobs helper functions', () => {
  beforeEach(() => {
    cronMock.Job.mockClear();
    cronMock.start.mockClear();
  });

  const schedule = {
    at: '10:42',
  };

  const appState = generateDefaultAppState();

  describe('createOnJob function', () => {
    it('should create enabled job', () => {
      // given-when
      const actual = createOnJob(schedule, true, appState);

      // then
      expect(actual).not.toBeNull();
      expect(actual).not.toBeUndefined();
      expect(cronMock.Job).toHaveBeenCalled();
      expect(cronMock.start).toHaveBeenCalled();
    });

    it('should create disabled job', () => {
      // given-when
      const actual = createOnJob(schedule, false, appState);

      // then
      expect(actual).not.toBeNull();
      expect(actual).not.toBeUndefined();
      expect(cronMock.Job).toHaveBeenCalled();
      expect(cronMock.start).not.toHaveBeenCalled();
    });
  });

  describe('createOffJob function', () => {
    it('should create enabled job', () => {
      // given-when
      const actual = createOffJob(schedule, true, appState);

      // then
      expect(actual).not.toBeNull();
      expect(actual).not.toBeUndefined();
      expect(cronMock.Job).toHaveBeenCalled();
      expect(cronMock.start).toHaveBeenCalled();
    });

    it('should create disabled job', () => {
      // given-when
      const actual = createOffJob(schedule, false, appState);

      // then
      expect(actual).not.toBeNull();
      expect(actual).not.toBeUndefined();
      expect(cronMock.Job).toHaveBeenCalled();
      expect(cronMock.start).not.toHaveBeenCalled();
    });
  });

  describe('toCronSyntax function', () => {
    it('should return correct syntax', () => {
      // given-when
      const actual = toCronSyntax(schedule);

      // then
      expect(actual).toEqual('00 42 10 * * *');
    });

    it('should return correct syntax when short schedule', () => {
      // given-when
      const actual = toCronSyntax({ at: '10' });

      // then
      expect(actual).toEqual('00 00 10 * * *');
    });

    it('should return correct syntax when empty schedule', () => {
      // given-when
      const actual = toCronSyntax({ at: '' });

      // then
      expect(actual).toEqual('* * * * * *');
    });

    it('should return correct syntax when missing schedule', () => {
      // given-when
      const actual = toCronSyntax({});

      // then
      expect(actual).toEqual('* * * * * *');
    });
  });
});
