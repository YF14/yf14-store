const express = require('express');
const router = express.Router();
const { protect, requireAdminOrPermission } = require('../middleware/auth');
const Color = require('../models/Color');
const { responseCache } = require('../middleware/responseCache');
const cacheBust = require('../services/cacheInvalidation');

const TTL_COLORS_MS = Number(process.env.CACHE_TTL_COLORS_MS) || 300_000;
const colorsCache = responseCache({ prefix: 'api:colors:', ttlMs: TTL_COLORS_MS });

router.get('/', colorsCache, async (req, res) => {
  try {
    const colors = await Color.find().sort('name');
    res.json({ colors });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', protect, requireAdminOrPermission('products'), async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and code are required' });
    const existing = await Color.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) return res.status(400).json({ error: 'Color already exists' });
    const color = await Color.create({ name, code });
    cacheBust.bustProductsAndColors();
    res.status(201).json({ color });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', protect, requireAdminOrPermission('products'), async (req, res) => {
  try {
    await Color.findByIdAndDelete(req.params.id);
    cacheBust.bustProductsAndColors();
    res.json({ message: 'Color deleted from palette' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
