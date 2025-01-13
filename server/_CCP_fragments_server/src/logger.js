// src/logger.js
// This file is a simple wrapper around Pino, a fast and lightweight logger for Node.js.
// It configures the logger based on the LOG_LEVEL environment variable, and if LOG_LEVEL is not set, it defaults to "info".If LOG_LEVEL is set to "debug", it also enables pretty - printing of logs.

const options = { level: process.env.LOG_LEVEL || 'info' };

// If we're doing `debug` logging, make the logs easier to read
if (options.level === 'debug') {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  };
}

// Create and export a Pino Logger instance
module.exports = require('pino')(options);
