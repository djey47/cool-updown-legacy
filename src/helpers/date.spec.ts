import { getTimeDetails } from './date';

describe('date/time helper functions', () => {
  describe('getTimeDetails function', () => {
    it('should return all fields at 0 when duration 0ms', () => {
      // given-when
      const actual = getTimeDetails(0);

      // then
      expect(actual).toEqual({
        days: 0, hours: 0, milliseconds: 0, minutes: 0, seconds: 0,
      });
    });

    it('should return all fields when complete duration', () => {
      // given-when
      const actual = getTimeDetails(98600005);

      // then
      expect(actual).toEqual({
        days: 1, hours: 3, milliseconds: 5, minutes: 23, seconds: 20,
      });
    });
  });
});
