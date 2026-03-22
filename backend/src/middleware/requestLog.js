const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

/**
 * Accept incoming X-Request-Id or generate one; expose on req and response header.
 */
function requestContext(req, res, next) {
  const incoming = req.get('X-Request-Id');
  req.requestId = incoming && String(incoming).trim().slice(0, 80) ? String(incoming).trim().slice(0, 80) : uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

const HEALTH_PATHS = new Set(['/api/health', '/api/health/email']);

/**
 * One structured line per finished request (also written to combined.log as JSON).
 */
function accessLog(req, res, next) {
  const start = process.hrtime.bigint();
  const skipHealth = process.env.LOG_HEALTH === '1' ? false : true;

  res.on('finish', () => {
    try {
      const pathOnly = req.originalUrl?.split('?')[0] || req.path;
      if (skipHealth && HEALTH_PATHS.has(pathOnly)) return;

      const durationMs = Math.round((Number(process.hrtime.bigint() - start) / 1e6) * 100) / 100;
      const uid = req.user?._id ?? req.user?.id;
      logger.info({
        message: 'HTTP',
        requestId: req.requestId,
        method: req.method,
        path: pathOnly,
        status: res.statusCode,
        durationMs,
        ...(uid && { userId: String(uid) }),
      });
    } catch {
      /* never break response */
    }
  });

  next();
}

module.exports = { requestContext, accessLog };
