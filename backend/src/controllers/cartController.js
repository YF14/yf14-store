const Cart = require('../models/Cart');
const Product = require('../models/Product');
const PromoCode = require('../models/PromoCode');

const populateCart = (cart) => cart.populate({ path: 'items.product', select: 'name images price slug isActive variants' });

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });
    await populateCart(cart);
    res.json({ cart });
  } catch (err) { next(err); }
};

function sameCartMeasurements(item, height, weight) {
  const ih = item.customerHeightCm != null ? Number(item.customerHeightCm) : null;
  const iw = item.customerWeightKg != null ? Number(item.customerWeightKg) : null;
  return ih === height && iw === weight;
}

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, variantId, quantity = 1, customerHeightCm, customerWeightKg } = req.body;
    const rawH = customerHeightCm != null && customerHeightCm !== '' ? Number(customerHeightCm) : null;
    const rawW = customerWeightKg != null && customerWeightKg !== '' ? Number(customerWeightKg) : null;
    const height = rawH != null && Number.isFinite(rawH) ? rawH : null;
    const weight = rawW != null && Number.isFinite(rawW) ? rawW : null;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ error: 'Product not found' });
    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });
    if (variant.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });

    const existingItem = cart.items.find(
      (i) => i.product.toString() === productId
        && i.variantId.toString() === variantId
        && sameCartMeasurements(i, height, weight),
    );
    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (variant.stock < newQty) return res.status(400).json({ error: 'Insufficient stock' });
      existingItem.quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        variantId,
        size: variant.size,
        color: variant.color,
        colorCode: variant.colorCode,
        quantity,
        price: variant.price || product.price,
        ...(height != null && !Number.isNaN(height) ? { customerHeightCm: height } : {}),
        ...(weight != null && !Number.isNaN(weight) ? { customerWeightKg: weight } : {}),
      });
    }
    await cart.save();
    await populateCart(cart);
    res.json({ cart });
  } catch (err) { next(err); }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (quantity <= 0) {
      item.deleteOne();
    } else {
      const product = await Product.findById(item.product);
      const variant = product?.variants.id(item.variantId);
      if (variant && variant.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });
      item.quantity = quantity;
    }
    await cart.save();
    await populateCart(cart);
    res.json({ cart });
  } catch (err) { next(err); }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
    await cart.save();
    await populateCart(cart);
    res.json({ cart });
  } catch (err) { next(err); }
};

exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [], promoCode: null, promoDiscount: 0 });
    res.json({ message: 'Cart cleared' });
  } catch (err) { next(err); }
};

exports.applyPromo = async (req, res, next) => {
  try {
    const { code } = req.body;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const promo = await PromoCode.findOne({ code: code.toUpperCase() });
    if (!promo) return res.status(404).json({ error: 'Invalid promo code.' });
    const validity = promo.isValid(req.user._id, subtotal);
    if (!validity.valid) return res.status(400).json({ error: validity.message });
    cart.promoCode = promo.code;
    cart.promoDiscount = promo.calculateDiscount(subtotal);
    await cart.save();
    res.json({ promoCode: cart.promoCode, promoDiscount: cart.promoDiscount });
  } catch (err) { next(err); }
};

exports.removePromo = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user.id }, { promoCode: null, promoDiscount: 0 });
    res.json({ message: 'Promo removed' });
  } catch (err) { next(err); }
};
