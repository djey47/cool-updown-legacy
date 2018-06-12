const { interpolate } = require('./format');

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

    it('should return placeholder when missing value', () => {
      // given-when
      const actual = interpolate('Template #{val} - {ok}', { val: 10 });

      // then
      expect(actual).toEqual('Template #10 - {?ok?}');
    });
  });
});
