const express = require('express');
const router = express.Router();
const { protect, requireAdminOrPermission } = require('../middleware/auth');
const Category = require('../models/Category');
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('sortOrder');
    res.json({ categories });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** Admin: all categories (incl. inactive) for management UI — must be before /:slug */
router.get('/admin/all', protect, requireAdminOrPermission('categories'), async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
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

router.post('/', protect, requireAdminOrPermission('categories'), async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ category });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', protect, requireAdminOrPermission('categories'), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ category });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', protect, requireAdminOrPermission('categories'), async (req, res) => {
  try {
    const childCount = await Category.countDocuments({ parent: req.params.id });
    if (childCount > 0) {
      return res.status(400).json({ error: 'Remove or reassign subcategories first.' });
    }
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ error: `Cannot delete: ${productCount} product(s) use this category.` });
    }
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
