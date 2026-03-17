const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/item/:itemId', cartController.updateCartItem);
router.delete('/item/:itemId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);
router.post('/promo', cartController.applyPromo);
router.delete('/promo', cartController.removePromo);

module.exports = router;
