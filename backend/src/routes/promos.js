const express = require('express');
const router = express.Router();
const { protect, optionalAuth, requireAdminOrPermission } = require('../middleware/auth');
const PromoCode = require('../models/PromoCode');
const { t, localeOf } = require('../utils/messages');

// Guests can validate coupons too (per-user limits only apply to logged-in users).
router.post('/validate', optionalAuth, async (req, res) => {
  try {
    const locale = localeOf(req);
    const { code, orderAmount } = req.body;
    const promo = await PromoCode.findOne({ code: code.toUpperCase() });
    if (!promo) return res.status(404).json({ error: t(locale, 'invalidPromo') });
    const validity = promo.isValid(req.user?._id || null, orderAmount, locale);
    if (!validity.valid) return res.status(400).json({ error: validity.message });
    const discount = promo.calculateDiscount(orderAmount);
    res.json({ valid: true, discount, type: promo.type, value: promo.value, code: promo.code });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin CRUD
router.get('/', protect, requireAdminOrPermission('promos'), async (req, res) => {
  const promos = await PromoCode.find().sort('-createdAt');
  res.json({ promos });
});

router.post('/', protect, requireAdminOrPermission('promos'), async (req, res) => {
  try {
    const promo = await PromoCode.create(req.body);
    res.status(201).json({ promo });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', protect, requireAdminOrPermission('promos'), async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ promo });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', protect, requireAdminOrPermission('promos'), async (req, res) => {
  await PromoCode.findByIdAndDelete(req.params.id);
  res.json({ message: 'Promo code deleted' });
});

module.exports = router;
