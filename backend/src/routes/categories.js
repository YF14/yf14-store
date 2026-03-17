const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Category = require('../models/Category');

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('sortOrder');
    res.json({ categories });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ category });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ category });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ category });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
