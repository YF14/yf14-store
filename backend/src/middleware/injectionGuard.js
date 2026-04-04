/**
 * Block NoSQL-style operator keys and prototype-pollution patterns in req.body / req.query.
 * Complements express-mongo-sanitize (which strips $ from keys after parsing).
 */

const BAD_KEY = /^\$|__proto__$|constructor$|^prototype$/;

function badKeysIn(obj, depth = 0) {
  if (depth > 14 || obj == null) return false;
  if (typeof obj !== 'object') return false;
  if (Buffer.isBuffer(obj) || obj instanceof Date) return false;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i += 1) {
      if (badKeysIn(obj[i], depth + 1)) return true;
    }
    return false;
  }
  for (const k of Object.keys(obj)) {
    if (BAD_KEY.test(k)) return true;
    if (badKeysIn(obj[k], depth + 1)) return true;
  }
  return false;
}

function objectDepth(obj, d = 0) {
  if (obj == null || typeof obj !== 'object') return d;
  if (Buffer.isBuffer(obj) || obj instanceof Date) return d;
  if (Array.isArray(obj)) {
    let m = d;
    for (let i = 0; i < obj.length; i += 1) {
      m = Math.max(m, objectDepth(obj[i], d + 1));
    }
    return m;
  }
  let m = d;
  for (const v of Object.values(obj)) {
    m = Math.max(m, objectDepth(v, d + 1));
  }
  return m;
}

const MAX_QUERY_DEPTH = Number(process.env.MAX_INPUT_DEPTH_QUERY) || 8;
const MAX_BODY_DEPTH = Number(process.env.MAX_INPUT_DEPTH_BODY) || 14;

function injectionGuard(req, res, next) {
  if (Buffer.isBuffer(req.body)) return next();
  try {
    if (badKeysIn(req.body) || badKeysIn(req.query)) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    if (objectDepth(req.query) > MAX_QUERY_DEPTH || objectDepth(req.body) > MAX_BODY_DEPTH) {
      return res.status(400).json({ error: 'Invalid request' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid request' });
  }
  next();
}

module.exports = injectionGuard;
