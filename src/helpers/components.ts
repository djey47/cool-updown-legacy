/*
 * Misc. page components
 */

/**
 * @returns contents in a pragraph then a link in a next one
 */
export function withBackLink(contents: string, linkUrl: string, linkText: string) {
    return `
    <p class="backlink-contents">${contents}</p>
    <p class="backlink-link"><a href="${linkUrl}">${linkText}</a></p>
    `;
}
