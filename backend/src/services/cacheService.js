const crypto = require('crypto');
const logger = require('../config/logger');

const ENABLED = process.env.CACHE_ENABLED !== 'false' && process.env.CACHE_ENABLED !== '0';
const MAX_ENTRIES = Math.min(50_000, Math.max(100, Number(process.env.CACHE_MAX_ENTRIES) || 5000));

/** @type {Map<string, { value: unknown, expiresAt: number }>} */
const store = new Map();

let hits = 0;
let misses = 0;

function pruneExpired() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expiresAt <= now) store.delete(k);
  }
}

function hashKey(raw) {
  return crypto.createHash('sha1').update(raw).digest('base64url').slice(0, 22);
}

/**
 * @param {string} prefix e.g. `api:products:`
 * @param {string} raw stable string (path + query + vary)
 */
function makeKey(prefix, raw) {
  return `${prefix}${hashKey(raw)}`;
}

function get(key) {
  if (!ENABLED) return null;
  const e = store.get(key);
  if (!e) {
    misses += 1;
    return null;
  }
  if (e.expiresAt <= Date.now()) {
    store.delete(key);
    misses += 1;
    return null;
  }
  hits += 1;
  return e.value;
}

function set(key, value, ttlMs) {
  if (!ENABLED) return;
  if (store.has(key)) store.delete(key);
  while (store.size >= MAX_ENTRIES) {
    const first = store.keys().next().value;
    if (first === undefined) break;
    store.delete(first);
  }
  store.set(key, { value, expiresAt: Date.now() + Math.max(1000, ttlMs) });
}

function invalidatePrefix(prefix) {
  let n = 0;
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) {
      store.delete(k);
      n += 1;
    }
  }
  if (n) logger.info(`Cache invalidated ${n} entries (prefix ${prefix})`);
}

function clear() {
  const n = store.size;
  store.clear();
  logger.info(`Cache cleared (${n} entries)`);
}

function getStats() {
  pruneExpired();
  const total = hits + misses;
  return {
    enabled: ENABLED,
    entries: store.size,
    maxEntries: MAX_ENTRIES,
    hits,
    misses,
    hitRate: total ? Math.round((hits / total) * 1000) / 1000 : 0,
  };
}

module.exports = {
  ENABLED,
  makeKey,
  get,
  set,
  invalidatePrefix,
  clear,
  getStats,
};
