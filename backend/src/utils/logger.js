const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

function formatMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
}

const logger = {
  debug(message, data) {
    if (CURRENT_LEVEL <= LOG_LEVELS.debug) {
      console.debug(formatMessage('debug', message, data));
    }
  },
  info(message, data) {
    if (CURRENT_LEVEL <= LOG_LEVELS.info) {
      console.log(formatMessage('info', message, data));
    }
  },
  warn(message, data) {
    if (CURRENT_LEVEL <= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, data));
    }
  },
  error(message, data) {
    if (CURRENT_LEVEL <= LOG_LEVELS.error) {
      console.error(formatMessage('error', message, data));
    }
  },
};

export default logger;
