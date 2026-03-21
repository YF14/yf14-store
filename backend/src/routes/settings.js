const express = require('express');
const router = express.Router();
const StoreSettings = require('../models/StoreSettings');

/** Public: storefront reads logo URL (no auth). */
router.get('/', async (req, res) => {
  try {
    const doc = await StoreSettings.findOne({ key: 'site' }).lean();
    res.json({ logoUrl: doc?.logoUrl || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
