/* @flow */

const MS_IN_1_S = 1000;
const MS_IN_1_M = MS_IN_1_S * 60;
const MS_IN_1_H = MS_IN_1_M * 60;
const MS_IN_1_D = MS_IN_1_H * 24;

/**
 * @returns Object with fields days, hours, minutes, seconds, milliseconds
 */
function getTimeDetails(durationMs: number): Object {
  let milliseconds = durationMs;

  const days = Math.floor(milliseconds / MS_IN_1_D);
  milliseconds %= MS_IN_1_D;

  const hours = Math.floor(milliseconds / MS_IN_1_H);
  milliseconds %= MS_IN_1_H;

  const minutes = Math.floor(milliseconds / MS_IN_1_M);
  milliseconds %= MS_IN_1_M;

  const seconds = Math.floor(milliseconds / MS_IN_1_S);
  milliseconds %= MS_IN_1_S;

  return {
    milliseconds,
    seconds,
    minutes,
    hours,
    days,
  };
}

module.exports = {
  getTimeDetails,
};
