const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, optionalAuth, requireAdminOrPermission } = require('../middleware/auth');
const { responseCache } = require('../middleware/responseCache');

const TTL_PRODUCTS_MS = Number(process.env.CACHE_TTL_PRODUCTS_MS) || 45_000;
const productCache = responseCache({ prefix: 'api:products:', ttlMs: TTL_PRODUCTS_MS });

router.get('/', optionalAuth, productCache, productController.getProducts);
router.get('/featured', productCache, productController.getFeatured);
router.get('/new-arrivals', productCache, productController.getNewArrivals);
router.get('/best-sellers', productCache, productController.getBestSellers);
router.get('/search', productCache, productController.searchProducts);
router.get('/price-range', productCache, productController.getProductPriceRange);
router.get('/colors', productCache, productController.getProductColors);
router.get('/sizes', productCache, productController.getProductSizes);

router.get('/admin/out-of-stock', protect, requireAdminOrPermission('stock'), productController.getOutOfStockProducts);
router.get('/admin/:id', protect, requireAdminOrPermission('products'), productController.getProductById);
router.post('/', protect, requireAdminOrPermission('products'), productController.createProduct);
router.put('/reorder-category', protect, requireAdminOrPermission('categories'), productController.reorderCategoryProducts);
router.put('/reorder-sale', protect, requireAdminOrPermission('sales'), productController.reorderSaleProducts);
router.put('/reorder-featured', protect, requireAdminOrPermission('featured'), productController.reorderFeaturedProducts);
router.put('/reorder-new-arrivals', protect, requireAdminOrPermission('newArrivals'), productController.reorderNewArrivalProducts);
router.put('/reorder-best-sellers', protect, requireAdminOrPermission('bestSellers'), productController.reorderBestSellerProducts);
router.put('/:id', protect, requireAdminOrPermission('products'), productController.updateProduct);
router.delete('/:id', protect, requireAdminOrPermission('products'), productController.deleteProduct);
router.patch('/:id/variants/:variantId/stock', protect, requireAdminOrPermission('stock'), productController.updateVariantStock);

router.post('/:id/reviews', protect, productController.addReview);
router.delete('/:id/reviews/:reviewId', protect, productController.deleteReview);

router.get('/:slug', optionalAuth, productCache, productController.getProduct);

module.exports = router;
