import config from 'config';
import { AppConfig, ColorTheme } from '../model/models';
import { MetaOptions } from '../model/page';
import { THEMES } from '../resources/themes';

export function generatePage(contentsAsHtml: string, metaOptions?: MetaOptions) {
  return `
  ${generateSharedPageContents(metaOptions)}
  ${contentsAsHtml}
  `;
}

/**
 * For testing use
 * @returns the theme name before changing it
 */
export function overrideUITheme(themeName) {
  const appConfig = config as unknown as AppConfig;
  const currentTheme = appConfig.ui?.theme;
  appConfig.ui.theme = themeName;
  return currentTheme;
}

function generateSharedPageContents(metaOptions?: MetaOptions) {
    const appConfig = config as unknown as AppConfig;
    return `
    ${generateStyles(appConfig.ui?.theme)}
    ${metaOptions ? generateMetas(metaOptions) : ''}
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

function generateMetas(metaOptions: MetaOptions) {
  return Object.entries(metaOptions).map(([metaKey, metaValue]) => {
    let metaName: string;
    let metaContents: string;

    switch(metaKey) {
      case 'refreshSeconds':
        metaName = 'refresh';
        metaContents = Number(metaValue).toString();
        break;
      default:
        return '';
    }

    return `<meta http-equiv="${metaName}" content="${metaContents}">`;
  }).join('\n');
}
