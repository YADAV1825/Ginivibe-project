/**
 * Structured JSON Logger
 * Production-safe logging with levels, timestamps, and context.
 * No sensitive data (SDP contents, ICE candidates) is logged.
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] ?? LOG_LEVELS.info;

function formatLog(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  });
}

const logger = {
  error(message, meta) {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(formatLog('error', message, meta));
    }
  },

  warn(message, meta) {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(formatLog('warn', message, meta));
    }
  },

  info(message, meta) {
    if (currentLevel >= LOG_LEVELS.info) {
      console.log(formatLog('info', message, meta));
    }
  },

  debug(message, meta) {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.log(formatLog('debug', message, meta));
    }
  },
};

module.exports = logger;
