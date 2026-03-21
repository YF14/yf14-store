const mongoose = require('mongoose');

/**
 * Singleton site branding (logo URL from ImageKit, etc.).
 * Only one logical row: key === 'site'.
 */
const storeSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'site', immutable: true },
    logoUrl: { type: String, default: '' },
    logoFileId: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
