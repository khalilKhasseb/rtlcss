const pino = require('pino');
const config = require('config');

// Configure logger
const logger = pino({
  level: config.get('logging.level'),
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: config.get('server.env') !== 'production',
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  base: {
    env: config.get('server.env'),
    service: 'rtlcss-api',
  },
});

module.exports = logger;