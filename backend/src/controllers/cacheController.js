const cache = require('../services/cacheService');

const SCOPES = ['all', 'products', 'categories', 'settings', 'colors'];

exports.getStats = (req, res) => {
  res.json(cache.getStats());
};

exports.clearCache = (req, res) => {
  const scope = String(req.body?.scope || 'all').toLowerCase();
  if (!SCOPES.includes(scope)) {
    return res.status(400).json({ error: `scope must be one of: ${SCOPES.join(', ')}` });
  }
  if (scope === 'all') {
    cache.clear();
  } else {
    cache.invalidatePrefix(`api:${scope}:`);
  }
  res.json({ ok: true, scope, stats: cache.getStats() });
};
