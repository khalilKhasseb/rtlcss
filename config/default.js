require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    allowedOrigins: process.env.ALLOWED_ORIGINS || '*',
  },
  auth: {
    secretKey: process.env.AUTH_SECRET_KEY || 'default_dev_secret_key_change_in_production',
    tokenExpiry: parseInt(process.env.TOKEN_EXPIRY || '3600', 10),
    requestTimeout: 100000, // 5 minutes in seconds
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // limit each IP to 100 requests per windowMs
  },
  upload: {
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB in bytes
    },
    allowedMimeTypes: [
      'text/css',
      'text/plain',
    ],
  },
  rtlcss: {
    defaultOptions: {
      autoRename: false,
      autoRenameStrict: false,
      blacklist: {},
      clean: true,
      greedy: false,
      processUrls: false,
      stringMap: [],
      useCalc: false,
    },
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};