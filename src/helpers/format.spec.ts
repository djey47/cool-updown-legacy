import { interpolate, toHumanDuration } from './format';

describe('formatting helper functions', () => {
  describe('interpolate function', () => {
    it('should return template when no placeholder', () => {
      // given-when
      const actual = interpolate('Template');

      // then
      expect(actual).toEqual('Template');
    });

    it('should return string with interpolation when provided values', () => {
      // given-when
      const actual = interpolate('Template #{val} - {ok}', { val: 10, ok: 'OK' });

      // then
      expect(actual).toEqual('Template #10 - OK');
    });

    it('should return string with interpolation when provided value at 0', () => {
      // given-when
      const actual = interpolate('Template #{val}', { val: 0 });

      // then
      expect(actual).toEqual('Template #0');
    });

    it('should return placeholder when missing value', () => {
      // given-when
      const actual = interpolate('Template #{val} - {ok}', { val: 10 });

      // then
      expect(actual).toEqual('Template #10 - {?ok?}');
    });
  });

  describe('toHumanDuration function', () => {
    it('should return empty string when undefined details', () => {
      // given-when-then
      expect(toHumanDuration(undefined)).toEqual('');
    });

    it('should return default string with all fields at 0', () => {
      // given-when
      const actual = toHumanDuration({
        milliseconds: 0, seconds: 0, minutes: 0, hours: 0, days: 0,
      });

      // then
      expect(actual).toEqual('less than one minute');
    });

    it('should return correct string with minutes only', () => {
      // given-when
      const actual = toHumanDuration({ minutes: 35 });

      // then
      expect(actual).toEqual('35 minute(s)');
    });

    it('should return correct string with all used fields', () => {
      // given-when
      const actual = toHumanDuration({
        milliseconds: 25, seconds: 10, minutes: 35, hours: 14, days: 9,
      });

      // then
      expect(actual).toEqual('9 day(s) 14 hour(s) 35 minute(s)');
    });
  });
});
