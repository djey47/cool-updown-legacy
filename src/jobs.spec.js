const { createOnJob, createOffJob, toCronSyntax } = require('./jobs');

const mockStart = jest.fn();

jest.mock('cron', () => ({
  CronJob: jest.fn(() => ({
    start: () => mockStart(),
  })),
}));

describe('jobs helper functions', () => {
  beforeEach(() => {
    mockStart.mockReset();
  });

  const schedule = {
    at: '10:42',
  };

  describe('createOnJob function', () => {
    it('should create enabled job', () => {
      // given-when
      const actual = createOnJob(schedule, true);

      // then
      expect(actual).not.toBeNull();
      expect(actual).not.toBeUndefined();
      expect(mockStart).toHaveBeenCalled();
    });

    it('should create disabled job', () => {
      // given-when
      const actual = createOnJob(schedule, false);

      // then
      expect(actual).not.toBeNull();
      expect(actual).not.toBeUndefined();
      expect(mockStart).not.toHaveBeenCalled();
    });
  });

  describe('createOffJob function', () => {
    it('should create enabled job', () => {
      // given-when
      const actual = createOffJob(schedule, true);

      // then
      expect(actual).not.toBeNull();
      expect(actual).not.toBeUndefined();
      expect(mockStart).toHaveBeenCalled();
    });

    it('should create disabled job', () => {
      // given-when
      const actual = createOffJob(schedule, false);

      // then
      expect(actual).not.toBeNull();
      expect(actual).not.toBeUndefined();
      expect(mockStart).not.toHaveBeenCalled();
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
