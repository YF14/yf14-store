const mongoose = require('mongoose');

/**
 * Singleton site branding (logo URL from Cloudflare Images / CDN, etc.).
 * Only one logical row: key === 'site'.
 */
const DEFAULT_ANNOUNCEMENT_EN = [
  'Delivery to Baghdad & 5 provinces',
  'New collections arrive every week',
  'Order via Instagram DM — @yf14_store',
];
const DEFAULT_ANNOUNCEMENT_AR = [
  'التوصيل لبغداد و5 محافظات',
  'وصلت مجموعات جديدة كل أسبوع',
  'للطلب راسلينا عبر الدايركت على إنستغرام',
];

const storeSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'site', immutable: true },
    logoUrl: { type: String, default: '' },
    logoFileId: { type: String, default: '' },
    /** Rotating homepage announcement lines (EN). Empty array = hide bar for that locale if both empty. */
    announcementMessagesEn: { type: [String], default: () => [...DEFAULT_ANNOUNCEMENT_EN] },
    announcementMessagesAr: { type: [String], default: () => [...DEFAULT_ANNOUNCEMENT_AR] },
  },
  { timestamps: true }
);

const StoreSettings = mongoose.model('StoreSettings', storeSettingsSchema);
StoreSettings.DEFAULT_ANNOUNCEMENT_EN = DEFAULT_ANNOUNCEMENT_EN;
StoreSettings.DEFAULT_ANNOUNCEMENT_AR = DEFAULT_ANNOUNCEMENT_AR;
module.exports = StoreSettings;
