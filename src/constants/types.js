/* @flow */

import type { Job } from 'cron';

export type AppState = {
  isScheduleEnabled: boolean,
  onJob: Job,
  offJob: Job,
  startedAt?: Date,
  serverStartedAt?: Date,
  serverStoppedAt?: Date,
};

export type Schedule = {
  at?: string,
};
