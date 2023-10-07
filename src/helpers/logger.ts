import winston from 'winston';
import shell from 'shelljs';
import appRootDir from 'app-root-dir';
import path from 'path';

/* DEFAULT LOGGER: appends to console and app.log file */

const logsDirectory = path.join(appRootDir.get(), 'logs');
shell.mkdir('-p', logsDirectory);

const logsFile = path.join(logsDirectory, 'app.log');

export default new winston.Logger({
  level: 'debug',
  handleExceptions: false,
  transports: [
    new winston.transports.Console({
      timestamp: true,
    }),
    new winston.transports.File({
      filename: logsFile,
      json: false,
    }),
  ],
});
