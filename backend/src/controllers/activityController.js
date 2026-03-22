const AuditLog = require('../models/AuditLog');

exports.listActivity = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 40));
    const { action, entityType } = req.query;
    const q = {};
    if (action && String(action).trim()) q.action = String(action).trim();
    if (entityType && String(entityType).trim()) q.entityType = String(entityType).trim();

    const total = await AuditLog.countDocuments(q);
    const logs = await AuditLog.find(q)
      .populate('actor', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
};
