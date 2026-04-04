const cache = require('../services/cacheService');

function stableQuery(query) {
  const q = query || {};
  const keys = Object.keys(q).sort();
  if (keys.length === 0) return '';
  return keys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(q[k]))}`).join('&');
}

/**
 * Cache successful JSON GET responses (status 200 only).
 * @param {{ prefix: string, ttlMs: number }} opts prefix must end with `:` e.g. `api:products:`
 */
function responseCache(opts) {
  const { prefix, ttlMs } = opts;
  return (req, res, next) => {
    if (!cache.ENABLED || req.method !== 'GET') return next();

    const uid = req.user?._id?.toString() || req.user?.id?.toString() || 'anon';
    const raw = `${req.baseUrl}${req.path}|${stableQuery(req.query)}|${uid}`;
    const key = cache.makeKey(prefix, raw);

    const hit = cache.get(key);
    if (hit !== null && hit !== undefined) {
      res.set('X-Cache', 'HIT');
      return res.status(200).json(hit);
    }

    const origJson = res.json.bind(res);
    res.json = function responseCacheJsonWrapper(body) {
      if (res.statusCode === 200) {
        try {
          cache.set(key, body, ttlMs);
        } catch (e) {
          /* ignore cache set errors */
        }
      }
      res.set('X-Cache', 'MISS');
      return origJson(body);
    };

    next();
  };
}

module.exports = { responseCache, stableQuery };
