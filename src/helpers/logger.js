/* @flow */

const winston = require('winston');
const shell = require('shelljs');
const appRootDir = require('app-root-dir');
const path = require('path');

/* DEFAULT LOGGER: appends to console and app.log file */

const logsDirectory = path.join(appRootDir.get(), 'logs');
shell.mkdir('-p', logsDirectory);

const logsFile = path.join(logsDirectory, 'app.log');

const Logger = new winston.Logger({
  level: 'info',
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

module.exports = Logger;
