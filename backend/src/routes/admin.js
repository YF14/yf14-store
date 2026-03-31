const express = require('express');
const router = express.Router();
const { protect, requireAdminOrPermissionAny, requireAdminOrPermission } = require('../middleware/auth');
const activityController = require('../controllers/activityController');

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

module.exports = router;
