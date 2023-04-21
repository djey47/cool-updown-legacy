import messages from '../resources/messages';

const REGEX_TEMPLATE = /{([\s\S]+?)}/g;

type TemplateContext = {
  [k: string]: any;
};

/**
 * Template interpolation helper
 * @return string with replaced {item} by corresponding value in templateContext
 */
export function interpolate(template: string, templateContext?: TemplateContext ) {
  return template.replace(
    REGEX_TEMPLATE,
    (match, submatch) => ({}.hasOwnProperty.call(templateContext, submatch)
      ? templateContext[submatch] : `{?${submatch}?}`),
  );
}

/**
 * @private
 */
function toDurationUnit(unitLabel: string, timeDetail?: number) {
  return timeDetail ? `${timeDetail} ${unitLabel}` : '';
}

interface TimeDetails {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

/**
 * @return string with readable time (till minutes)
 */
export function toHumanDuration(timeDetails?: TimeDetails) {
  if (!timeDetails) return '';

  const { days, hours, minutes } = timeDetails;
  const { dates: datesMessages } = messages;
  const duration = `${toDurationUnit(datesMessages.days, days)} ${toDurationUnit(datesMessages.hours, hours)} ${toDurationUnit(datesMessages.minutes, minutes)}`
    .trim();

  return duration.length
    ? duration : datesMessages.lessThanOneMinute;
}
