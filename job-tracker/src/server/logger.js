// Minimal console-backed logger replacing the winston logger used by the
// Express backend (backend/utils/logger.js). File transports are dropped
// since serverless functions have no persistent filesystem.
const logger = {
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

export default logger;
