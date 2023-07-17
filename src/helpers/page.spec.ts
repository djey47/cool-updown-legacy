import { generatePage } from './page';

describe('page helper', () => {
  describe('generatePage function', () => {
    it('should include styles with provided theme', () => {
      // given-when
      const generated = generatePage('<div>contents</div>');

      // then
      expect(generated).toMatchSnapshot();
    });
  });
});
