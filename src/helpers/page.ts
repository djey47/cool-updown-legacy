import config from 'config';
import { AppConfig, ColorTheme } from '../model/models';
import { THEMES } from '../resources/themes';

export function generatePage(contentsAsHtml: string) {
  return `
  ${generateSharedPageContents()}
  ${contentsAsHtml}
  `;
}

function generateSharedPageContents() {
    const appConfig = config as unknown as AppConfig;
    return `
    ${generateStyles(appConfig.ui?.theme)}
    `;
}

function retrieveThemeRules(theme: ColorTheme) {
  // console.log('page::retrieveThemeRules', { theme });

  if (!theme || !THEMES[theme]) {
    return THEMES.light;
  }

  return THEMES[theme];
}

function generateStyles(theme: ColorTheme) {
  const { fontFamily, backgroundColor, color, linkColor } = retrieveThemeRules(theme);
  const styleRules = `
    body { 
      font-family: ${fontFamily};
      background-color: ${backgroundColor};
      color: ${color};
    }
    body a {
      color: ${linkColor};
    }
  `;
  return `<style type="text/css">${styleRules}</style>`
}
