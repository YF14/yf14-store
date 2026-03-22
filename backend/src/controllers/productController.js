const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const { recordAudit, variantStockDiff } = require('../services/auditService');

const ALLOWED_SORT_KEYS = new Set([
  'createdAt', '-createdAt', 'price', '-price', 'name', '-name',
  'averageRating', '-averageRating', 'totalSold', '-totalSold',
  'categorySortOrder', '-categorySortOrder',
  'saleSortOrder', '-saleSortOrder',
  'featuredSortOrder', '-featuredSortOrder',
  'newArrivalSortOrder', '-newArrivalSortOrder',
  'lastStockUpdateAt', '-lastStockUpdateAt',
]);

const FEATURED_MATCH = { isFeatured: true };
const NEW_ARRIVAL_MATCH = { isNewArrival: true };

const SALE_MATCH = { $expr: { $gt: ['$comparePrice', '$price'] } };

function qualifiesAsSale(doc) {
  if (!doc) return false;
  const cp = doc.comparePrice;
  const pr = doc.price;
  return cp != null && pr != null && Number(cp) > Number(pr);
}

/** Products on /sale: compare (old) price strictly greater than current price. */
function applySaleFilter(target) {
  target.$expr = { $gt: ['$comparePrice', '$price'] };
}

function canUseShowAllProducts(req) {
  const u = req.user;
  if (!u) return false;
  if (u.role === 'admin') return true;
  if (u.role !== 'staff') return false;
  const p = u.adminPermissions || [];
  return p.some((x) => ['products', 'stock', 'categories', 'sales', 'featured', 'newArrivals'].includes(x));
}

function buildSort(sortParam) {
  const s = String(sortParam || '-createdAt').trim();
  if (!ALLOWED_SORT_KEYS.has(s)) return { createdAt: -1 };
  if (s === 'categorySortOrder') return { categorySortOrder: 1, createdAt: -1 };
  if (s === '-categorySortOrder') return { categorySortOrder: -1, createdAt: -1 };
  if (s === 'saleSortOrder') return { saleSortOrder: 1, createdAt: -1 };
  if (s === '-saleSortOrder') return { saleSortOrder: -1, createdAt: -1 };
  if (s === 'featuredSortOrder') return { featuredSortOrder: 1, createdAt: -1 };
  if (s === '-featuredSortOrder') return { featuredSortOrder: -1, createdAt: -1 };
  if (s === 'newArrivalSortOrder') return { newArrivalSortOrder: 1, createdAt: -1 };
  if (s === '-newArrivalSortOrder') return { newArrivalSortOrder: -1, createdAt: -1 };
  if (s === 'lastStockUpdateAt') return { lastStockUpdateAt: 1, createdAt: -1 };
  if (s === '-lastStockUpdateAt') return { lastStockUpdateAt: -1, createdAt: -1 };
  return s;
}

exports.getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, minPrice, maxPrice, sizes, colors, sort = '-createdAt', search, filter, showAll } = req.query;
    const query = {};
    if (!showAll || !canUseShowAllProducts(req)) query.isActive = true;

    if (filter === 'sale') {
      applySaleFilter(query);
    } else if (filter === 'new') {
      query.isNewArrival = true;
    } else if (filter === 'featured') {
      query.isFeatured = true;
    }

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category }).select('_id');
        query.category = cat ? cat._id : new mongoose.Types.ObjectId();
      }
    }
    if (minPrice || maxPrice) query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
    if (sizes) query['variants.size'] = { $in: sizes.split(',') };
    if (colors) query['variants.color'] = { $in: colors.split(',') };
    if (search) query.$text = { $search: search };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(buildSort(sort))
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-reviews');

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .populate('reviews.user', 'firstName lastName avatar');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) { next(err); }
};

exports.getFeatured = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .sort({ featuredSortOrder: 1, createdAt: -1 })
      .limit(8)
      .select('-reviews')
      .populate('category', 'name slug');
    res.json({ products });
  } catch (err) { next(err); }
};

exports.getNewArrivals = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isNewArrival: true })
      .sort({ newArrivalSortOrder: 1, createdAt: -1 })
      .limit(8)
      .select('-reviews')
      .populate('category', 'name slug');
    res.json({ products });
  } catch (err) { next(err); }
};

exports.getBestSellers = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).sort('-totalSold').limit(8).select('-reviews').populate('category', 'name slug');
    res.json({ products });
  } catch (err) { next(err); }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ products: [] });
    const products = await Product.find({ isActive: true, $text: { $search: q } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .select('name slug images price averageRating');
    res.json({ products });
  } catch (err) { next(err); }
};

exports.getProductPriceRange = async (req, res, next) => {
  try {
    const { filter } = req.query;
    const match = { isActive: true };
    if (filter === 'sale') applySaleFilter(match);
    else if (filter === 'new') match.isNewArrival = true;
    else if (filter === 'featured') match.isFeatured = true;

    const result = await Product.aggregate([
      { $match: match },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]);
    const { min = 0, max = 1000000 } = result[0] || {};
    res.json({ min, max });
  } catch (err) { next(err); }
};

exports.getProductColors = async (req, res, next) => {
  try {
    const { category, sizes, filter } = req.query;
    const match = { isActive: true, 'variants.0': { $exists: true } };
    if (filter === 'sale') applySaleFilter(match);
    else if (filter === 'new') match.isNewArrival = true;
    else if (filter === 'featured') match.isFeatured = true;

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        match.category = new mongoose.Types.ObjectId(category);
      } else {
        const cat = await Category.findOne({ slug: category }).select('_id');
        match.category = cat ? cat._id : new mongoose.Types.ObjectId();
      }
    }
    if (sizes) match['variants.size'] = { $in: sizes.split(',') };
    const variantMatch = { 'variants.color': { $exists: true, $ne: '' } };
    if (sizes) variantMatch['variants.size'] = { $in: sizes.split(',') };

    const colors = await Product.aggregate([
      { $match: match },
      { $unwind: '$variants' },
      { $match: variantMatch },
      // one entry per (product, color) pair to count distinct products
      { $group: { _id: { productId: '$_id', color: '$variants.color' }, colorCode: { $first: '$variants.colorCode' } } },
      { $group: { _id: '$_id.color', colorCode: { $first: '$colorCode' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, color: '$_id', colorCode: 1, count: 1 } },
    ]);
    res.json({ colors });
  } catch (err) { next(err); }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    if (!req.body.slug) {
      req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (req.body.category != null && req.body.categorySortOrder === undefined) {
      const last = await Product.findOne({ category: req.body.category })
        .sort({ categorySortOrder: -1 })
        .select('categorySortOrder')
        .lean();
      req.body.categorySortOrder = (last?.categorySortOrder ?? -1) + 1;
    }
    if (qualifiesAsSale(req.body) && req.body.saleSortOrder === undefined) {
      const last = await Product.findOne(SALE_MATCH).sort({ saleSortOrder: -1 }).select('saleSortOrder').lean();
      req.body.saleSortOrder = (last?.saleSortOrder ?? -1) + 1;
    }
    if (req.body.isFeatured && req.body.featuredSortOrder === undefined) {
      const last = await Product.findOne(FEATURED_MATCH).sort({ featuredSortOrder: -1 }).select('featuredSortOrder').lean();
      req.body.featuredSortOrder = (last?.featuredSortOrder ?? -1) + 1;
    }
    if (req.body.isNewArrival && req.body.newArrivalSortOrder === undefined) {
      const last = await Product.findOne(NEW_ARRIVAL_MATCH).sort({ newArrivalSortOrder: -1 }).select('newArrivalSortOrder').lean();
      req.body.newArrivalSortOrder = (last?.newArrivalSortOrder ?? -1) + 1;
    }
    const product = await Product.create(req.body);
    await recordAudit(req, 'product.created', {
      entityType: 'product',
      entityId: product._id,
      entityLabel: product.name,
      details: { slug: product.slug },
    });
    res.status(201).json({ product });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const existing = await Product.findById(req.params.id).select(
      'category comparePrice price saleSortOrder isFeatured isNewArrival featuredSortOrder newArrivalSortOrder name slug variants'
    ).lean();
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    const body = { ...req.body };
    if (body.category && String(body.category) !== String(existing.category) && body.categorySortOrder === undefined) {
      const last = await Product.findOne({ category: body.category })
        .sort({ categorySortOrder: -1 })
        .select('categorySortOrder')
        .lean();
      body.categorySortOrder = (last?.categorySortOrder ?? -1) + 1;
    }
    const wasSale = qualifiesAsSale(existing);
    const willSale = qualifiesAsSale({
      comparePrice: body.comparePrice !== undefined ? body.comparePrice : existing.comparePrice,
      price: body.price !== undefined ? body.price : existing.price,
    });
    if (willSale && !wasSale && body.saleSortOrder === undefined) {
      const last = await Product.findOne(SALE_MATCH).sort({ saleSortOrder: -1 }).select('saleSortOrder').lean();
      body.saleSortOrder = (last?.saleSortOrder ?? -1) + 1;
    }
    const wasFeatured = !!existing.isFeatured;
    const willFeatured = body.isFeatured !== undefined ? !!body.isFeatured : wasFeatured;
    if (willFeatured && !wasFeatured && body.featuredSortOrder === undefined) {
      const last = await Product.findOne(FEATURED_MATCH).sort({ featuredSortOrder: -1 }).select('featuredSortOrder').lean();
      body.featuredSortOrder = (last?.featuredSortOrder ?? -1) + 1;
    }
    const wasNewArrival = !!existing.isNewArrival;
    const willNewArrival = body.isNewArrival !== undefined ? !!body.isNewArrival : wasNewArrival;
    if (willNewArrival && !wasNewArrival && body.newArrivalSortOrder === undefined) {
      const last = await Product.findOne(NEW_ARRIVAL_MATCH).sort({ newArrivalSortOrder: -1 }).select('newArrivalSortOrder').lean();
      body.newArrivalSortOrder = (last?.newArrivalSortOrder ?? -1) + 1;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    await recordAudit(req, 'product.updated', {
      entityType: 'product',
      entityId: product._id,
      entityLabel: product.name,
      details: {
        slug: product.slug,
        updatedFields: Object.keys(body),
        stockChanges: variantStockDiff(existing.variants || [], product.variants || []),
      },
    });
    res.json({ product });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id).select('name slug').lean();
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    if (p) {
      await recordAudit(req, 'product.deactivated', {
        entityType: 'product',
        entityId: p._id,
        entityLabel: p.name,
        details: { slug: p.slug },
      });
    }
    res.json({ message: 'Product deactivated' });
  } catch (err) { next(err); }
};

/** Admin: set display order for all products in a category (orderedProductIds = full ordered list). */
exports.reorderCategoryProducts = async (req, res, next) => {
  try {
    const { categoryId, orderedProductIds } = req.body;
    if (!categoryId || !Array.isArray(orderedProductIds)) {
      return res.status(400).json({ error: 'categoryId and orderedProductIds[] are required' });
    }
    const inCategory = await Product.find({ category: categoryId }).select('_id').lean();
    const valid = new Set(inCategory.map((p) => String(p._id)));
    if (orderedProductIds.length !== valid.size) {
      return res.status(400).json({ error: 'orderedProductIds must list every product in this category exactly once' });
    }
    for (const id of orderedProductIds) {
      if (!valid.has(String(id))) {
        return res.status(400).json({ error: 'Invalid product id or wrong category' });
      }
    }
    await Promise.all(
      orderedProductIds.map((id, i) => Product.updateOne({ _id: id, category: categoryId }, { categorySortOrder: i }))
    );
    await recordAudit(req, 'product.reorder_category', {
      entityType: 'category',
      entityId: categoryId,
      details: { productCount: orderedProductIds.length },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
};

/** Admin: order for /sale listing (all products matching sale rules). */
exports.reorderSaleProducts = async (req, res, next) => {
  try {
    const { orderedProductIds } = req.body;
    if (!Array.isArray(orderedProductIds)) {
      return res.status(400).json({ error: 'orderedProductIds[] is required' });
    }
    const inSale = await Product.find(SALE_MATCH).select('_id').lean();
    const valid = new Set(inSale.map((p) => String(p._id)));
    if (orderedProductIds.length !== valid.size) {
      return res.status(400).json({ error: 'orderedProductIds must list every current sale product exactly once' });
    }
    for (const id of orderedProductIds) {
      if (!valid.has(String(id))) {
        return res.status(400).json({ error: 'Invalid product id or not in sale' });
      }
    }
    await Promise.all(
      orderedProductIds.map((id, i) => Product.updateOne({ _id: id }, { saleSortOrder: i }))
    );
    await recordAudit(req, 'product.reorder_sale', {
      entityType: 'product',
      details: { productCount: orderedProductIds.length },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
};

/** Admin: order for /featured listing. */
exports.reorderFeaturedProducts = async (req, res, next) => {
  try {
    const { orderedProductIds } = req.body;
    if (!Array.isArray(orderedProductIds)) {
      return res.status(400).json({ error: 'orderedProductIds[] is required' });
    }
    const list = await Product.find(FEATURED_MATCH).select('_id').lean();
    const valid = new Set(list.map((p) => String(p._id)));
    if (orderedProductIds.length !== valid.size) {
      return res.status(400).json({ error: 'orderedProductIds must list every featured product exactly once' });
    }
    for (const id of orderedProductIds) {
      if (!valid.has(String(id))) {
        return res.status(400).json({ error: 'Invalid product id or not featured' });
      }
    }
    await Promise.all(
      orderedProductIds.map((id, i) => Product.updateOne({ _id: id }, { featuredSortOrder: i }))
    );
    await recordAudit(req, 'product.reorder_featured', {
      entityType: 'product',
      details: { productCount: orderedProductIds.length },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
};

/** Admin: order for /new-arrivals listing. */
exports.reorderNewArrivalProducts = async (req, res, next) => {
  try {
    const { orderedProductIds } = req.body;
    if (!Array.isArray(orderedProductIds)) {
      return res.status(400).json({ error: 'orderedProductIds[] is required' });
    }
    const list = await Product.find(NEW_ARRIVAL_MATCH).select('_id').lean();
    const valid = new Set(list.map((p) => String(p._id)));
    if (orderedProductIds.length !== valid.size) {
      return res.status(400).json({ error: 'orderedProductIds must list every new-arrival product exactly once' });
    }
    for (const id of orderedProductIds) {
      if (!valid.has(String(id))) {
        return res.status(400).json({ error: 'Invalid product id or not marked new arrival' });
      }
    }
    await Promise.all(
      orderedProductIds.map((id, i) => Product.updateOne({ _id: id }, { newArrivalSortOrder: i }))
    );
    await recordAudit(req, 'product.reorder_new_arrivals', {
      entityType: 'product',
      details: { productCount: orderedProductIds.length },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.updateVariantStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const variant = product.variants.id(req.params.variantId);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });
    const fromStock = variant.stock;
    variant.stock = stock;
    product.lastStockUpdateAt = new Date();
    await product.save();
    await recordAudit(req, 'product.stock_updated', {
      entityType: 'product',
      entityId: product._id,
      entityLabel: product.name,
      details: {
        variantId: String(variant._id),
        size: variant.size,
        color: variant.color,
        from: fromStock,
        to: stock,
      },
    });
    const fresh = await Product.findById(product._id)
      .populate('category', 'name slug')
      .select('-reviews');
    res.json({ product: fresh });
  } catch (err) { next(err); }
};

exports.addReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Check already reviewed
    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user.id.toString());
    if (alreadyReviewed) return res.status(400).json({ error: 'You already reviewed this product.' });

    // Check verified purchase
    const order = await Order.findOne({
      user: req.user.id,
      'items.product': req.params.id,
      status: { $nin: ['cancelled', 'refunded'] },
    });

    const review = { user: req.user.id, rating: req.body.rating, title: req.body.title, body: req.body.body, verified: !!order };
    product.reviews.push(review);
    product.calculateRating();
    await product.save();
    await product.populate('reviews.user', 'firstName lastName avatar');
    res.status(201).json({ reviews: product.reviews, averageRating: product.averageRating });
  } catch (err) { next(err); }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    review.deleteOne();
    product.calculateRating();
    await product.save();
    res.json({ message: 'Review deleted' });
  } catch (err) { next(err); }
};
