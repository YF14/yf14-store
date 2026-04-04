const mongoose = require('mongoose');

/**
 * When MongoDB is down, storefront APIs should fail fast with 503 (maintenance).
 * Skips /api/health* so platform probes and readiness checks still work.
 */
function requireDatabase(req, res, next) {
  const path = req.path || '';
  if (!path.startsWith('/api/') || path.startsWith('/api/health')) {
    return next();
  }
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  res.status(503).json({
    error: 'Service temporarily unavailable',
    maintenance: true,
    database: 'disconnected',
  });
}

module.exports = requireDatabase;
