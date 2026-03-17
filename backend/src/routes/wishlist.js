// wishlist.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.use(protect);

router.get('/', async (req, res) => {
  const user = await User.findById(req.user.id).populate('wishlist');
  res.json({ wishlist: user.wishlist });
});

router.post('/:productId', async (req, res) => {
  const user = await User.findById(req.user.id);
  const idx = user.wishlist.indexOf(req.params.productId);
  if (idx === -1) user.wishlist.push(req.params.productId);
  else user.wishlist.splice(idx, 1);
  await user.save();
  res.json({ wishlist: user.wishlist });
});

module.exports = router;
