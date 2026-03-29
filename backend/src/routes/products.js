const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, optionalAuth, requireAdminOrPermission } = require('../middleware/auth');

router.get('/', optionalAuth, productController.getProducts);
router.get('/featured', productController.getFeatured);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/best-sellers', productController.getBestSellers);
router.get('/search', productController.searchProducts);
router.get('/price-range', productController.getProductPriceRange);
router.get('/colors', productController.getProductColors);
router.get('/sizes', productController.getProductSizes);

router.get('/admin/out-of-stock', protect, requireAdminOrPermission('stock'), productController.getOutOfStockProducts);
router.get('/admin/:id', protect, requireAdminOrPermission('products'), productController.getProductById);
router.post('/', protect, requireAdminOrPermission('products'), productController.createProduct);
router.put('/reorder-category', protect, requireAdminOrPermission('categories'), productController.reorderCategoryProducts);
router.put('/reorder-sale', protect, requireAdminOrPermission('sales'), productController.reorderSaleProducts);
router.put('/reorder-featured', protect, requireAdminOrPermission('featured'), productController.reorderFeaturedProducts);
router.put('/reorder-new-arrivals', protect, requireAdminOrPermission('newArrivals'), productController.reorderNewArrivalProducts);
router.put('/:id', protect, requireAdminOrPermission('products'), productController.updateProduct);
router.delete('/:id', protect, requireAdminOrPermission('products'), productController.deleteProduct);
router.patch('/:id/variants/:variantId/stock', protect, requireAdminOrPermission('stock'), productController.updateVariantStock);

router.post('/:id/reviews', protect, productController.addReview);
router.delete('/:id/reviews/:reviewId', protect, productController.deleteReview);

router.get('/:slug', optionalAuth, productController.getProduct);

module.exports = router;
