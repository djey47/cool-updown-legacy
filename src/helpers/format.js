/* @flow */
/* eslint-disable import/prefer-default-export */

const REGEX_TEMPLATE = /{([\s\S]+?)}/g;

/**
 * Template interpolation helper
 * @return string with replaced {item} by corresponding value in templateContext
 */
function interpolate(template: string, templateContext: Object): string {
  return template.replace(
    REGEX_TEMPLATE,
    (match, submatch) => ({}.hasOwnProperty.call(templateContext, submatch) ?
      templateContext[submatch] : `{?${submatch}?}`),
  );
}

/**
 * @private
 */
function toDurationUnit(timeDetail?: number, unitLabel: string): string {
  return timeDetail ? `${timeDetail} ${unitLabel}` : '';
}

/**
 * @return string with readable time (till minutes)
 */
function toHumanDuration(timeDetails?: Object): string {
  if (!timeDetails) return '';

  const { days, hours, minutes } = timeDetails;
  const duration = `${toDurationUnit(days, 'day(s)')} ${toDurationUnit(hours, 'hour(s)')} ${toDurationUnit(minutes, 'minute(s)')}`
    .trim();

  return duration.length ?
    duration : 'less than one minute';
}

module.exports = {
  interpolate,
  toHumanDuration,
};
