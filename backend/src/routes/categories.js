const express = require('express');
const router = express.Router();
const { protect, requireAdminOrPermission } = require('../middleware/auth');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { responseCache } = require('../middleware/responseCache');
const cacheBust = require('../services/cacheInvalidation');

const TTL_CATEGORIES_MS = Number(process.env.CACHE_TTL_CATEGORIES_MS) || 120_000;
const categoryCache = responseCache({ prefix: 'api:categories:', ttlMs: TTL_CATEGORIES_MS });

router.get('/', categoryCache, async (req, res) => {
  try {
    // Never expose hidden categories to the public storefront
    const categories = await Category.find({ isActive: true, isHidden: { $ne: true } }).sort('sortOrder');
    res.json({ categories });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** Admin: all categories (incl. inactive and hidden) for management UI — must be before /:slug */
router.get('/admin/all', protect, requireAdminOrPermission('categories'), async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
    res.json({ categories });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** Admin: list products tagged to a hidden category */
router.get('/hidden/:id/products', protect, requireAdminOrPermission('categories'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category || !category.isHidden) return res.status(404).json({ error: 'Hidden category not found' });
    const products = await Product.find({ hiddenCategories: req.params.id })
      .select('name slug images price variants isActive category')
      .populate('category', 'name slug')
      .lean();
    res.json({ products });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** Admin: assign existing products to a hidden category */
router.post('/hidden/:id/products', protect, requireAdminOrPermission('categories'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category || !category.isHidden) return res.status(404).json({ error: 'Hidden category not found' });
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'productIds array required' });
    }
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $addToSet: { hiddenCategories: req.params.id } }
    );
    cacheBust.bustProductsAndCategories();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** Admin: remove a product from a hidden category */
router.delete('/hidden/:id/products/:productId', protect, requireAdminOrPermission('categories'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category || !category.isHidden) return res.status(404).json({ error: 'Hidden category not found' });
    await Product.updateOne(
      { _id: req.params.productId },
      { $pull: { hiddenCategories: category._id } }
    );
    cacheBust.bustProductsAndCategories();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:slug', categoryCache, async (req, res) => {
  try {
    // Hidden categories are invisible to the public — return 404 so nothing leaks
    const category = await Category.findOne({ slug: req.params.slug, isActive: true, isHidden: { $ne: true } });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ category });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', protect, requireAdminOrPermission('categories'), async (req, res) => {
  try {
    const category = await Category.create(req.body);
    cacheBust.bustProductsAndCategories();
    res.status(201).json({ category });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', protect, requireAdminOrPermission('categories'), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    cacheBust.bustProductsAndCategories();
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
    cacheBust.bustProductsAndCategories();
    res.json({ message: 'Category deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
