const winston = require('winston');

/* DEFAULT LOGGER */

module.exports = new winston.Logger({
  level: 'info',
  handleExceptions: false,
  transports: [
    new winston.transports.Console({
      timestamp: true,
    }),
  ],
});
