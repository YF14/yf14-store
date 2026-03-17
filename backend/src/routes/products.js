const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeatured);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/best-sellers', productController.getBestSellers);
router.get('/search', productController.searchProducts);
router.get('/:slug', optionalAuth, productController.getProduct);

// Reviews (protected)
router.post('/:id/reviews', protect, productController.addReview);
router.delete('/:id/reviews/:reviewId', protect, productController.deleteReview);

// Admin only
router.post('/', protect, adminOnly, productController.createProduct);
router.put('/:id', protect, adminOnly, productController.updateProduct);
router.delete('/:id', protect, adminOnly, productController.deleteProduct);
router.patch('/:id/variants/:variantId/stock', protect, adminOnly, productController.updateVariantStock);

module.exports = router;
