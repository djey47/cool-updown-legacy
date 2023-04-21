export interface AppState {
  isScheduleEnabled?: boolean;
  onJob?: typeof CronJob;
  offJob?: typeof CronJob;
  startedAt?: Date;
  serverStartedAt?: Date;
  serverStoppedAt?: Date;
}

export interface AppConfig {
  server?: {
    password?: string;
  }
}

export interface Schedule {
  at?: string;
}

export type HandlerCallback = (req: Express.Request, res: TypedResponse<string>, appState: AppState) => void;
