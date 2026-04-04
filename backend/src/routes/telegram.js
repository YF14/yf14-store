const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const telegramService = require('../services/telegramService');
const emailService = require('../services/emailService');
const logger = require('../config/logger');
const cacheBust = require('../services/cacheInvalidation');

function iqd(v) {
  return `${Number(v || 0).toLocaleString('en-US')} IQD`;
}

function getPhone(order) {
  return order.guestInfo?.phone || order.shippingAddress?.phone || 'N/A';
}

router.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  let cbId = null;
  try {
    const update = req.body;
    if (!update.callback_query) return;

    const query = update.callback_query;
    const data = query.data;
    const chatId = query.message.chat.id;
    const msgId = query.message.message_id;
    cbId = query.id;

    const firstUnderscore = data.indexOf('_');
    if (firstUnderscore < 1) {
      await telegramService.answerCallback(cbId, '❌ بيانات الزر غير صالحة');
      return;
    }
    const action = data.slice(0, firstUnderscore);
    const orderId = data.slice(firstUnderscore + 1);

    const VALID_ACTIONS = ['approve', 'decline', 'ship', 'deliver', 'cancel'];
    if (!orderId || !VALID_ACTIONS.includes(action)) {
      await telegramService.answerCallback(cbId, '❌ إجراء غير معروف');
      return;
    }

    const order = await Order.findById(orderId).populate('user', 'firstName lastName email');
    if (!order) {
      await telegramService.answerCallback(cbId, '❌ الطلب غير موجود');
      return;
    }

    const customerName = order.guestInfo?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'زائر';
    const customerEmail = order.guestInfo?.email || order.user?.email;
    const phone = getPhone(order);
    const address = telegramService.buildOrderAddress(order);
    const items = telegramService.formatOrderItemsLines(order);

    // ── APPROVE ──────────────────────────────────────────────────────────
    if (action === 'approve') {
      if (order.status !== 'pending') {
        await telegramService.answerCallback(cbId, `⚠️ الطلب بالفعل: ${order.status}`);
        return;
      }
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'تم الموافقة عبر تيليغرام' });
      await order.save();

      emailService.sendOrderStatusUpdate(order).catch((e) => logger.error('Email error:', e));

      await telegramService.answerCallback(cbId, '✅ تمت الموافقة!');
      await telegramService.editOrderMessage(
        chatId, msgId,
        `✅ تمت الموافقة على الطلب\n\n` +
        `📦 ${order.orderNumber}\n` +
        `👤 ${customerName}\n` +
        `📞 الهاتف: ${phone}\n` +
        `📧 الإيميل: ${customerEmail || 'N/A'}\n` +
        `📍 العنوان: ${address}\n\n` +
        `🧾 المنتجات:\n${items}\n\n` +
        `💵 الإجمالي: ${iqd(order.total)}\n\n` +
        `${customerEmail ? '✉️ تم إرسال إيميل للعميل' : '📵 لا يوجد إيميل للعميل'}`,
        {
          inline_keyboard: [
            [
              { text: '🚚 في الطريق',   callback_data: `ship_${order._id}` },
              { text: '✅ تم التسليم', callback_data: `deliver_${order._id}` },
            ],
            [
              { text: '❌ إلغاء الطلب', callback_data: `cancel_${order._id}` },
            ],
          ],
        }
      );

    // ── DECLINE ──────────────────────────────────────────────────────────
    } else if (action === 'decline') {
      if (order.status !== 'pending') {
        await telegramService.answerCallback(cbId, `⚠️ الطلب بالفعل: ${order.status}`);
        return;
      }
      order.status = 'cancelled';
      order.statusHistory.push({ status: 'cancelled', note: 'تم الرفض عبر تيليغرام' });

      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stock': item.quantity, totalSold: -item.quantity } }
        );
      }
      await order.save();
      cacheBust.bustProducts();

      emailService.sendOrderStatusUpdate(order).catch((e) => logger.error('Email error:', e));

      await telegramService.answerCallback(cbId, '❌ تم رفض الطلب');
      await telegramService.editOrderMessage(
        chatId, msgId,
        `❌ تم رفض الطلب\n\n` +
        `📦 ${order.orderNumber}\n` +
        `👤 ${customerName}\n` +
        `📞 الهاتف: ${phone}\n` +
        `📧 الإيميل: ${customerEmail || 'N/A'}\n` +
        `📍 العنوان: ${address}\n\n` +
        `🧾 المنتجات:\n${items}\n\n` +
        `💵 الإجمالي: ${iqd(order.total)}\n\n` +
        `تم إعادة المخزون${customerEmail ? ' وإخطار العميل' : ''}`
      );

    // ── SHIP ─────────────────────────────────────────────────────────────
    } else if (action === 'ship') {
      if (!['confirmed', 'processing'].includes(order.status)) {
        await telegramService.answerCallback(cbId, `⚠️ الطلب بالفعل: ${order.status}`);
        return;
      }
      order.status = 'shipped';
      order.statusHistory.push({ status: 'shipped', note: 'تم التحديث عبر تيليغرام: في الطريق' });
      await order.save();

      emailService.sendOrderStatusUpdate(order).catch((e) => logger.error('Email error:', e));

      await telegramService.answerCallback(cbId, '🚚 تم تحديث الطلب: في الطريق');
      await telegramService.editOrderMessage(
        chatId, msgId,
        `🚚 الطلب في الطريق\n\n` +
        `📦 ${order.orderNumber}\n` +
        `👤 ${customerName}\n` +
        `📞 الهاتف: ${phone}\n` +
        `📧 الإيميل: ${customerEmail || 'N/A'}\n` +
        `📍 العنوان: ${address}\n\n` +
        `🧾 المنتجات:\n${items}\n\n` +
        `💵 الإجمالي: ${iqd(order.total)}\n\n` +
        `${customerEmail ? '✉️ تم إرسال إيميل للعميل' : '📵 لا يوجد إيميل للعميل'}`,
        {
          inline_keyboard: [
            [
              { text: '✅ تم التسليم', callback_data: `deliver_${order._id}` },
            ],
            [
              { text: '❌ إلغاء الطلب', callback_data: `cancel_${order._id}` },
            ],
          ],
        }
      );

    // ── DELIVER ───────────────────────────────────────────────────────────
    } else if (action === 'deliver') {
      if (order.status === 'delivered') {
        await telegramService.answerCallback(cbId, '⚠️ الطلب تم تسليمه مسبقاً');
        return;
      }
      if (!['confirmed', 'processing', 'shipped'].includes(order.status)) {
        await telegramService.answerCallback(cbId, `⚠️ الطلب بالفعل: ${order.status}`);
        return;
      }
      order.status = 'delivered';
      order.deliveredAt = new Date();
      order.statusHistory.push({ status: 'delivered', note: 'تم التحديث عبر تيليغرام: تم التسليم' });
      await order.save();

      emailService.sendOrderStatusUpdate(order).catch((e) => logger.error('Email error:', e));

      await telegramService.answerCallback(cbId, '🎉 تم التسليم!');
      await telegramService.editOrderMessage(
        chatId, msgId,
        `🎉 تم تسليم الطلب بنجاح\n\n` +
        `📦 ${order.orderNumber}\n` +
        `👤 ${customerName}\n` +
        `📞 الهاتف: ${phone}\n` +
        `📧 الإيميل: ${customerEmail || 'N/A'}\n` +
        `📍 العنوان: ${address}\n\n` +
        `🧾 المنتجات:\n${items}\n\n` +
        `💵 الإجمالي: ${iqd(order.total)}\n\n` +
        `${customerEmail ? '✉️ تم إرسال إيميل للعميل' : '📵 لا يوجد إيميل للعميل'}`
      );

    // ── CANCEL (available at any active stage) ────────────────────────────
    } else if (action === 'cancel') {
      if (['cancelled', 'delivered', 'refunded'].includes(order.status)) {
        await telegramService.answerCallback(cbId, `⚠️ لا يمكن إلغاء الطلب — الحالة: ${order.status}`);
        return;
      }

      const prevStatus = order.status;
      order.status = 'cancelled';
      order.statusHistory.push({ status: 'cancelled', note: `تم الإلغاء عبر تيليغرام (كان: ${prevStatus})` });

      // Restore stock for each item
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stock': item.quantity, totalSold: -item.quantity } }
        );
      }
      await order.save();
      cacheBust.bustProducts();

      emailService.sendOrderStatusUpdate(order).catch((e) => logger.error('Email error:', e));

      await telegramService.answerCallback(cbId, '🚫 تم إلغاء الطلب');
      await telegramService.editOrderMessage(
        chatId, msgId,
        `🚫 تم إلغاء الطلب\n\n` +
        `📦 ${order.orderNumber}\n` +
        `👤 ${customerName}\n` +
        `📞 الهاتف: ${phone}\n` +
        `📧 الإيميل: ${customerEmail || 'N/A'}\n` +
        `📍 العنوان: ${address}\n\n` +
        `🧾 المنتجات:\n${items}\n\n` +
        `💵 الإجمالي: ${iqd(order.total)}\n\n` +
        `تم إعادة المخزون${customerEmail ? ' وإخطار العميل' : ''}`
      );
    }
  } catch (err) {
    logger.error('Telegram webhook error:', err);
    if (cbId) {
      await telegramService.answerCallback(cbId, '❌ خطأ في الخادم — حاول مرة أخرى');
    }
  }
});

router.get('/set-webhook', async (req, res) => {
  if (req.query.secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const webhookUrl = `${process.env.BACKEND_URL}/api/telegram/webhook`;
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      }
    );
    res.json(await response.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
