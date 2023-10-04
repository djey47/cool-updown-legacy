import { CronJob } from 'cron';
import { TypedResponse } from './express';

export interface ApiRequest {
  params: {
    serverId?: string;
  };
}

export interface ServerState {
  startedAt?: Date;
  stoppedAt?: Date;
  isScheduleEnabled?: boolean;
  onJob?: CronJob;
  offJob?: CronJob;
}

export interface AppState {
  isScheduleEnabled?: boolean;
  onJob?: CronJob;
  offJob?: CronJob;
  startedAt?: Date;
  servers: ServerState[];
}

export interface ServerConfig {
  url?: string;
  network?: {
    broadcastIpAddress: string;
    hostname: string;
    macAddress: string;
  };
  ssh?: {
    keyPath: string;
    offCommand?: string;
    password?: string;
    port?: number;
    user: string;
  };
  schedule?: {
    enabled: boolean;
    on: Schedule;
    off: Schedule; 
  };
}

export enum ColorTheme {
  light = 'light',
  dark = 'dark',
  crimson = "crimson",
}

export interface AppConfig {
  app?: {
    port?: number;
    authEnabled?: boolean;
    user?: string;
    password?: string;
  };
  servers: ServerConfig[];
  ui?: {
    statusRefreshInterval?: number;
    theme?: ColorTheme;
  }
}

export interface Schedule {
  at?: string;
}

export type HandlerCallback = (req: Express.Request, res: TypedResponse<string>, appState: AppState) => void;
