const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

// Guest checkout (no auth required)
router.post('/guest', orderController.createGuestOrder);

// User routes
router.post('/', protect, orderController.createOrder);
router.get('/my-orders', protect, orderController.getMyOrders);
router.get('/:id', protect, orderController.getOrder);
router.post('/:id/cancel', protect, orderController.cancelOrder);

// Admin routes
router.get('/', protect, adminOnly, orderController.getAllOrders);
router.patch('/:id/status', protect, adminOnly, orderController.updateOrderStatus);
router.patch('/:id/tracking', protect, adminOnly, orderController.updateTracking);

module.exports = router;
