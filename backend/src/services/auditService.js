const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

/**
 * Persist who did what (never throws — failures are logged only).
 * @param {import('express').Request} req
 * @param {string} action — e.g. product.created, product.stock_updated
 * @param {object} opts
 */
async function recordAudit(req, action, opts = {}) {
  try {
    const u = req.user;
    if (!u || !u._id) return;

    const {
      entityType = '',
      entityId = null,
      entityLabel = '',
      details = {},
    } = opts;

    await AuditLog.create({
      actor: u._id,
      actorEmail: u.email || '',
      actorRole: u.role || 'user',
      action,
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      entityLabel: entityLabel || undefined,
      details: details && typeof details === 'object' ? details : {},
      ip: req.ip,
      requestId: req.requestId,
    });
  } catch (e) {
    logger.warn({ message: 'audit_write_failed', err: e.message });
  }
}

function variantStockDiff(prevVariants, nextVariants) {
  if (!Array.isArray(prevVariants) || !Array.isArray(nextVariants)) return [];
  const prevMap = new Map(
    prevVariants.map((v) => [String(v._id), { stock: v.stock, size: v.size, color: v.color }])
  );
  const out = [];
  for (const v of nextVariants) {
    const id = String(v._id);
    const old = prevMap.get(id);
    if (old && Number(old.stock) !== Number(v.stock)) {
      out.push({
        variantId: id,
        size: v.size,
        color: v.color,
        from: old.stock,
        to: v.stock,
      });
    }
  }
  return out;
}

module.exports = { recordAudit, variantStockDiff };
