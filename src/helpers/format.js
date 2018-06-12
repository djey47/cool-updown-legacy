/* eslint-disable import/prefer-default-export */

const REGEX_TEMPLATE = /{([\s\S]+?)}/g;

/**
 * Template interpolation helper
 * @return string with replaced {item} by corresponding value in templateContext
 */
function interpolate(template, templateContext) {
  return template.replace(REGEX_TEMPLATE, (match, submatch) => templateContext[submatch] || `{?${submatch}?}`);
}

module.exports = {
  interpolate,
};
