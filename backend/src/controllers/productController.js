const Product = require('../models/Product');
const Order = require('../models/Order');

exports.getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, minPrice, maxPrice, sizes, colors, sort = '-createdAt', search } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (minPrice || maxPrice) query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
    if (sizes) query['variants.size'] = { $in: sizes.split(',') };
    if (colors) query['variants.color'] = { $in: colors.split(',') };
    if (search) query.$text = { $search: search };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
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
    const products = await Product.find({ isActive: true, isFeatured: true }).limit(8).select('-reviews').populate('category', 'name slug');
    res.json({ products });
  } catch (err) { next(err); }
};

exports.getNewArrivals = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, isNewArrival: true }).sort('-createdAt').limit(8).select('-reviews').populate('category', 'name slug');
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

exports.createProduct = async (req, res, next) => {
  try {
    if (!req.body.slug) {
      req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    const product = await Product.create(req.body);
    res.status(201).json({ product });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Product deactivated' });
  } catch (err) { next(err); }
};

exports.updateVariantStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const variant = product.variants.id(req.params.variantId);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });
    variant.stock = stock;
    await product.save();
    res.json({ product });
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
      paymentStatus: 'paid'
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
