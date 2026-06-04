const { dbModel } = require('../config/db');

const auditLogSchema = {
  adminUserId: { type: String, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. Create Movie, Edit Showtime, Delete Promo
  targetResource: { type: String, required: true }, // e.g. Movie, Showtime, Promo
  payload: { type: String }, // JSON details
  timestamp: { type: String, required: true }
};

module.exports = dbModel('AuditLog', auditLogSchema);
