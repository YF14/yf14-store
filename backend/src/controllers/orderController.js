const Order = require('../models/Order');
const Product = require('../models/Product');
const PromoCode = require('../models/PromoCode');
const Cart = require('../models/Cart');
const emailService = require('../services/emailService');
const telegramService = require('../services/telegramService');
const { recordAudit } = require('../services/auditService');

/** Flat delivery (IQD); optional env override. Frontend `lib/deliveryFee.js` should match. */
const DELIVERY_FEE_IQD = Number(process.env.DELIVERY_FEE_IQD) || 5000;

exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, promoCode, paymentMethod = 'cash' } = req.body;

    // Validate & reserve stock
    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) return res.status(400).json({ error: `Product ${item.product} not available.` });

      const variant = product.variants.id(item.variantId);
      if (!variant) return res.status(400).json({ error: `Variant not found for ${product.name}.` });

      // Products tagged to a hidden category have unlimited stock — skip the check
      const isUnlimited = Array.isArray(product.hiddenCategories) && product.hiddenCategories.length > 0;
      if (!isUnlimited && variant.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name} (${variant.size}/${variant.color}).` });
      }

      const price = variant.price || product.price;
      subtotal += price * item.quantity;

      validatedItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0]?.url || '',
        price,
        size: variant.size,
        color: variant.color,
        colorCode: variant.colorCode,
        quantity: item.quantity,
        variantId: variant._id,
        _isUnlimited: isUnlimited,
        ...(item.customerHeightCm != null ? { customerHeightCm: Number(item.customerHeightCm) } : {}),
        ...(item.customerWeightKg != null ? { customerWeightKg: Number(item.customerWeightKg) } : {}),
      });
    }

    // Apply promo
    let promoDiscount = 0;
    let appliedPromoCode = null;
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase() });
      if (promo) {
        const validity = promo.isValid(req.user._id, subtotal);
        if (validity.valid) {
          promoDiscount = promo.calculateDiscount(subtotal);
          appliedPromoCode = promo.code;
          promo.usedCount += 1;
          promo.usedBy.push(req.user._id);
          await promo.save();
        }
      }
    }

    const shippingCost = DELIVERY_FEE_IQD;
    const total = subtotal + shippingCost - promoDiscount;

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: validatedItems,
      shippingAddress,
      subtotal,
      shippingCost,
      promoCode: appliedPromoCode,
      promoDiscount,
      total,
      paymentMethod,
      statusHistory: [{ status: 'pending', note: 'Order placed' }],
    });

    // Deduct stock (skip for unlimited-stock / hidden-category products)
    for (const item of validatedItems) {
      if (item._isUnlimited) {
        // Only increment totalSold, never reduce stock
        await Product.updateOne({ _id: item.product }, { $inc: { totalSold: item.quantity } });
      } else {
        await Product.updateOne(
          { _id: item.product, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stock': -item.quantity, totalSold: item.quantity } }
        );
      }
    }

    // Clear cart
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [], promoCode: null, promoDiscount: 0 });

    // Notify
    const populatedOrder = await Order.findById(order._id).populate('user', 'firstName lastName email');
    await emailService.sendOrderConfirmation(populatedOrder);
    await telegramService.notifyNewOrder(populatedOrder);

    res.status(201).json({ order, orderNumber: order.orderNumber });
  } catch (err) { next(err); }
};

exports.createGuestOrder = async (req, res, next) => {
  try {
    const { guestInfo, items, promoCode } = req.body;

    if (!guestInfo?.name || !guestInfo?.phone || !guestInfo?.city || !guestInfo?.town) {
      return res.status(400).json({ error: 'Name, phone, city and town are required.' });
    }
    const phoneClean = guestInfo.phone.replace(/\s|-/g, '');
    if (!/^(07\d{9}|7\d{9})$/.test(phoneClean)) {
      return res.status(400).json({ error: 'Invalid phone number. Must be 07xxxxxxxxx or 7xxxxxxxxx.' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    // Validate & reserve stock
    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) return res.status(400).json({ error: `Product not available.` });

      const variant = product.variants.id(item.variantId);
      if (!variant) return res.status(400).json({ error: `Variant not found for ${product.name}.` });

      // Products tagged to a hidden category have unlimited stock — skip the check
      const isUnlimited = Array.isArray(product.hiddenCategories) && product.hiddenCategories.length > 0;
      if (!isUnlimited && variant.stock < item.quantity) {
        return res.status(400).json({ error: `Only ${variant.stock} left for ${product.name} (${variant.size}/${variant.color}).` });
      }

      const price = variant.price || product.price;
      subtotal += price * item.quantity;

      validatedItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0]?.url || '',
        price,
        size: variant.size,
        color: variant.color,
        colorCode: variant.colorCode,
        quantity: item.quantity,
        variantId: variant._id,
        _isUnlimited: isUnlimited,
        ...(item.customerHeightCm != null ? { customerHeightCm: Number(item.customerHeightCm) } : {}),
        ...(item.customerWeightKg != null ? { customerWeightKg: Number(item.customerWeightKg) } : {}),
      });
    }

    // Apply promo
    let promoDiscount = 0;
    let appliedPromoCode = null;
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase() });
      if (promo) {
        const validity = promo.isValid(null, subtotal);
        if (validity.valid) {
          promoDiscount = promo.calculateDiscount(subtotal);
          appliedPromoCode = promo.code;
          promo.usedCount += 1;
          await promo.save();
        }
      }
    }

    const shippingCost = DELIVERY_FEE_IQD;
    const total = subtotal + shippingCost - promoDiscount;

    const order = await Order.create({
      user: null,
      guestInfo,
      items: validatedItems,
      shippingAddress: {
        firstName: guestInfo.name.split(' ')[0] || guestInfo.name,
        lastName: guestInfo.name.split(' ').slice(1).join(' ') || '',
        city: guestInfo.city,
        state: guestInfo.town || '',
        phone: guestInfo.phone,
        country: 'IQ',
      },
      subtotal,
      shippingCost,
      promoCode: appliedPromoCode,
      promoDiscount,
      total,
      paymentMethod: 'cash',
      statusHistory: [{ status: 'pending', note: 'Guest order placed' }],
    });

    // Deduct stock (skip for unlimited-stock / hidden-category products)
    for (const item of validatedItems) {
      if (item._isUnlimited) {
        await Product.updateOne({ _id: item.product }, { $inc: { totalSold: item.quantity } });
      } else {
        await Product.updateOne(
          { _id: item.product, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stock': -item.quantity, totalSold: item.quantity } }
        );
      }
    }

    // Telegram notification (adapt for guest)
    const orderForNotify = {
      ...order.toObject(),
      user: { firstName: guestInfo.name, lastName: '', email: guestInfo.email || guestInfo.phone },
    };
    await telegramService.notifyNewOrder(orderForNotify);

    // Confirmation email: customer + BCC store (or store-only if guest left no email)
    await emailService.sendOrderConfirmation(order);

    res.status(201).json({ order, orderNumber: order.orderNumber });
  } catch (err) { next(err); }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const orders = await Order.find({ user: req.user.id })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Order.countDocuments({ user: req.user.id });
    res.json({ orders, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    res.json({ order });
  } catch (err) { next(err); }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user.toString() !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    if (!['pending', 'confirmed'].includes(order.status)) return res.status(400).json({ error: 'Order cannot be cancelled at this stage.' });

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by customer', updatedBy: req.user.id });
    await order.save();

    // Restore stock (skip for unlimited-stock / hidden-category products)
    for (const item of order.items) {
      const prod = await Product.findById(item.product).select('hiddenCategories').lean();
      const isUnlimited = Array.isArray(prod?.hiddenCategories) && prod.hiddenCategories.length > 0;
      if (isUnlimited) {
        await Product.updateOne({ _id: item.product }, { $inc: { totalSold: -item.quantity } });
      } else {
        await Product.updateOne(
          { _id: item.product, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stock': item.quantity, totalSold: -item.quantity } }
        );
      }
    }

    res.json({ order });
  } catch (err) { next(err); }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.orderNumber = { $regex: search, $options: 'i' };

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Order.countDocuments(query);
    res.json({ orders, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const fromStatus = order.status;
    order.status = status;
    order.statusHistory.push({ status, note, updatedBy: req.user.id });
    if (status === 'delivered') order.deliveredAt = new Date();
    await order.save();
    await recordAudit(req, 'order.status_updated', {
      entityType: 'order',
      entityId: order._id,
      entityLabel: order.orderNumber,
      details: { from: fromStatus, to: status, note: note || '' },
    });
    await emailService.sendOrderStatusUpdate(order);
    res.json({ order });
  } catch (err) { next(err); }
};

exports.updateTracking = async (req, res, next) => {
  try {
    const { trackingNumber, shippingCarrier, estimatedDelivery } = req.body;
    const prev = await Order.findById(req.params.id).select('orderNumber trackingNumber shippingCarrier estimatedDelivery').lean();
    if (!prev) return res.status(404).json({ error: 'Order not found' });
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { trackingNumber, shippingCarrier, estimatedDelivery },
      { new: true }
    );
    await recordAudit(req, 'order.tracking_updated', {
      entityType: 'order',
      entityId: order._id,
      entityLabel: order.orderNumber,
      details: {
        before: {
          trackingNumber: prev.trackingNumber,
          shippingCarrier: prev.shippingCarrier,
          estimatedDelivery: prev.estimatedDelivery,
        },
        after: { trackingNumber, shippingCarrier, estimatedDelivery },
      },
    });
    res.json({ order });
  } catch (err) { next(err); }
};
