const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');

router.get('/product/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .select('reviews averageRating reviewCount')
      .populate('reviews.user', 'firstName lastName avatar');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ reviews: product.reviews, averageRating: product.averageRating, reviewCount: product.reviewCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
