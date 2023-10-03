import { MetaOptions } from '../model/page';
import { generatePage, overrideUITheme } from './page';

describe('page helper', () => {
  describe('generatePage function', () => {
    it('should include styles with provided theme', () => {
      // given-when
      const generated = generatePage('<div>contents</div>');

      // then
      expect(generated).toMatchSnapshot();
    });       
    
    it('should include default styles with unknown theme', () => {
      // given
      const previousTheme = overrideUITheme('foo');

      // when
      const generated = generatePage('<div>contents</div>');

      // then
      expect(generated).toMatchSnapshot();
      overrideUITheme(previousTheme);
    });    
    
    it('should include metas with provided options', () => {
      // given
      const metaOptions: MetaOptions = {
        refreshSeconds: 10,
      };

      // when
      const generated = generatePage('', metaOptions);

      // then
      expect(generated).toMatchSnapshot();
    });    
    
    it('should not include metas with unknown option', () => {
      // given
      const metaOptions = {
        foo: 'bar',
      };

      // when
      const generated = generatePage('', metaOptions as MetaOptions);

      // then
      expect(generated).toMatchSnapshot();
    });
  });
});
