const express = require('express');
const router = express.Router();
const { protect, requireAdminOrPermissionAny, requireAdminOrPermission } = require('../middleware/auth');
const activityController = require('../controllers/activityController');
const cacheController = require('../controllers/cacheController');

router.use(
  protect,
  requireAdminOrPermissionAny(
    'dashboard',
    'analytics',
    'products',
    'categories',
    'sales',
    'featured',
    'newArrivals',
    'bestSellers',
    'stock',
    'orders',
    'users',
    'promos',
    'settings',
    'activity'
  )
);

router.get('/health', (req, res) => {
  res.json({ status: 'Admin API OK', user: req.user.email });
});

router.get('/activity', requireAdminOrPermission('activity'), activityController.listActivity);

router.get('/cache/stats', requireAdminOrPermission('settings'), cacheController.getStats);
router.post('/cache/clear', requireAdminOrPermission('settings'), cacheController.clearCache);

module.exports = router;
