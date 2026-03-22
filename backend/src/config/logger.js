const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(process.cwd(), 'logs');

function resolveLevel() {
  const fromEnv = (process.env.LOG_LEVEL || '').trim().toLowerCase();
  const allowed = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
  if (fromEnv && allowed.includes(fromEnv)) return fromEnv;
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    if (message === 'HTTP' && meta.method) {
      const rid = meta.requestId ? ` [${meta.requestId.slice(0, 8)}]` : '';
      const uid = meta.userId ? ` u=${meta.userId}` : '';
      return `${timestamp} ${level}: ${meta.method} ${meta.path} ${meta.status} ${meta.durationMs}ms${rid}${uid}`;
    }
    const base = stack ? `${timestamp} ${level}: ${message}\n${stack}` : `${timestamp} ${level}: ${message}`;
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return base + extra;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

if (process.env.LOG_TO_FILE !== '0') {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: jsonFormat,
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
        tailable: true,
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: jsonFormat,
        maxsize: 5 * 1024 * 1024,
        maxFiles: 5,
        tailable: true,
      })
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[logger] File transports disabled:', e.message);
  }
}

const logger = winston.createLogger({
  level: resolveLevel(),
  levels: winston.config.npm.levels,
  defaultMeta: { service: process.env.LOG_SERVICE_NAME || 'maison-elara-api' },
  transports,
});

/**
 * @param {Error} err
 * @param {Record<string, unknown>} [context]
 */
function logError(err, context = {}) {
  if (!err) return;
  const msg = err.message || String(err);
  logger.error(msg, {
    ...context,
    stack: err.stack,
    name: err.name,
  });
}

/** Winston child logger with default `scope` meta (does not replace logger.child). */
function createScopedLogger(scope) {
  return logger.child({ scope });
}

module.exports = logger;
module.exports.logError = logError;
module.exports.createScopedLogger = createScopedLogger;
module.exports.resolveLevel = resolveLevel;
