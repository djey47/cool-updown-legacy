export interface AppState {
  isScheduleEnabled?: boolean;
  onJob?: typeof CronJob;
  offJob?: typeof CronJob;
  startedAt?: Date;
  serverStartedAt?: Date;
  serverStoppedAt?: Date;
}

export interface AppConfig {
  app?: {
    port?: number;
    authEnabled?: boolean;
  };  
  server?: {
    macAddress?: string;
    broadcastAddress?: string;
    hostname?: string;
    user?: string;
    password?: string;
    offCommand?: string;
    sshPort?: number;
    keyPath?: string;
    url?: string;
  };
  schedule?: {
    enabled?: boolean;
    on?: Schedule;
    off?: Schedule; 
  }
}

export interface Schedule {
  at?: string;
}

export type HandlerCallback = (req: Express.Request, res: TypedResponse<string>, appState: AppState) => void;
