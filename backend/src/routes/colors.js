const express = require('express');
const router = express.Router();
const { protect, requireAdminOrPermission } = require('../middleware/auth');
const Color = require('../models/Color');

router.get('/', async (req, res) => {
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
    res.status(201).json({ color });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', protect, requireAdminOrPermission('products'), async (req, res) => {
  try {
    await Color.findByIdAndDelete(req.params.id);
    res.json({ message: 'Color deleted from palette' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
