const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorEmail: { type: String, required: true },
    actorRole: { type: String, default: 'staff' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
    entityLabel: { type: String },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String },
    requestId: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
