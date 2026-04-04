const express = require('express');
const router = express.Router();
const StoreSettings = require('../models/StoreSettings');
const { protect, requireAdminOrPermission } = require('../middleware/auth');
const { responseCache } = require('../middleware/responseCache');
const cacheBust = require('../services/cacheInvalidation');

const TTL_SETTINGS_MS = Number(process.env.CACHE_TTL_SETTINGS_MS) || 60_000;
const settingsCache = responseCache({ prefix: 'api:settings:', ttlMs: TTL_SETTINGS_MS });

const { DEFAULT_ANNOUNCEMENT_EN, DEFAULT_ANNOUNCEMENT_AR } = StoreSettings;

function resolveAnnouncements(doc) {
  if (!doc) {
    return {
      announcementMessagesEn: [...DEFAULT_ANNOUNCEMENT_EN],
      announcementMessagesAr: [...DEFAULT_ANNOUNCEMENT_AR],
    };
  }
  const en = doc.announcementMessagesEn;
  const ar = doc.announcementMessagesAr;
  return {
    announcementMessagesEn: Array.isArray(en)
      ? en
      : [...DEFAULT_ANNOUNCEMENT_EN],
    announcementMessagesAr: Array.isArray(ar)
      ? ar
      : [...DEFAULT_ANNOUNCEMENT_AR],
  };
}

/** Public: storefront reads logo + rotating announcements */
router.get('/', settingsCache, async (req, res) => {
  try {
    const doc = await StoreSettings.findOne({ key: 'site' }).lean();
    const ann = resolveAnnouncements(doc);
    res.json({
      logoUrl: doc?.logoUrl || null,
      ...ann,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Admin: update announcement lines (logo still via /upload/store-logo) */
router.put('/', protect, requireAdminOrPermission('settings'), async (req, res) => {
  try {
    const { announcementMessagesEn, announcementMessagesAr } = req.body;
    const update = {};
    if (Array.isArray(announcementMessagesEn)) {
      update.announcementMessagesEn = announcementMessagesEn
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, 10);
    }
    if (Array.isArray(announcementMessagesAr)) {
      update.announcementMessagesAr = announcementMessagesAr
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, 10);
    }
    if (Object.keys(update).length === 0) {
      const doc = await StoreSettings.findOne({ key: 'site' }).lean();
      return res.json({
        logoUrl: doc?.logoUrl || null,
        ...resolveAnnouncements(doc),
      });
    }
    const doc = await StoreSettings.findOneAndUpdate(
      { key: 'site' },
      { $set: update },
      { upsert: true, new: true }
    ).lean();
    cacheBust.bustSettings();
    res.json({
      logoUrl: doc?.logoUrl || null,
      ...resolveAnnouncements(doc),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
