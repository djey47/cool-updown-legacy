const REGEX_TEMPLATE = /{([\s\S]+?)}/g;

/**
 * Template interpolation helper
 * @return string with replaced {item} by corresponding value in templateContext
 */
export function interpolate(template, templateContext) {
  return template.replace(
    REGEX_TEMPLATE,
    (match, submatch) => ({}.hasOwnProperty.call(templateContext, submatch)
      ? templateContext[submatch] : `{?${submatch}?}`),
  );
}

/**
 * @private
 */
function toDurationUnit(timeDetail, unitLabel) {
  return timeDetail ? `${timeDetail} ${unitLabel}` : '';
}

/**
 * @return string with readable time (till minutes)
 */
export function toHumanDuration(timeDetails) {
  if (!timeDetails) return '';

  const { days, hours, minutes } = timeDetails;
  const duration = `${toDurationUnit(days, 'day(s)')} ${toDurationUnit(hours, 'hour(s)')} ${toDurationUnit(minutes, 'minute(s)')}`
    .trim();

  return duration.length
    ? duration : 'less than one minute';
}
