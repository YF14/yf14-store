const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, requireAdminOrPermission } = require('../middleware/auth');

// Guest checkout (no auth required)
router.post('/guest', orderController.createGuestOrder);

// User routes
router.post('/', protect, orderController.createOrder);
router.get('/my-orders', protect, orderController.getMyOrders);

// Admin routes (before /:id)
router.get('/', protect, requireAdminOrPermission('orders'), orderController.getAllOrders);
router.patch('/:id/status', protect, requireAdminOrPermission('orders'), orderController.updateOrderStatus);
router.patch('/:id/tracking', protect, requireAdminOrPermission('orders'), orderController.updateTracking);

router.get('/:id', protect, orderController.getOrder);
router.post('/:id/cancel', protect, orderController.cancelOrder);

module.exports = router;
