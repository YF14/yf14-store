const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const telegramService = require('../services/telegramService');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

function iqd(v) {
  return `${Number(v || 0).toLocaleString('en-US')} IQD`;
}

function buildFullAddress(order) {
  const guest = order.guestInfo;
  const addr = order.shippingAddress;
  const parts = [];
  if (guest) {
    if (guest.city) parts.push(guest.city);
    if (guest.town) parts.push(guest.town);
  } else if (addr) {
    if (addr.street) parts.push(addr.street);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.country) parts.push(addr.country);
    if (addr.zipCode) parts.push(addr.zipCode);
  }
  return parts.join(', ') || 'N/A';
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

    if (!orderId || !['approve', 'decline'].includes(action)) {
      await telegramService.answerCallback(cbId, '❌ إجراء غير معروف');
      return;
    }

    const order = await Order.findById(orderId).populate('user', 'firstName lastName email');
    if (!order) {
      await telegramService.answerCallback(cbId, '❌ الطلب غير موجود');
      return;
    }

    if (order.status !== 'pending') {
      await telegramService.answerCallback(cbId, `⚠️ الطلب بالفعل: ${order.status}`);
      return;
    }

    const customerName = order.guestInfo?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'زائر';
    const customerEmail = order.guestInfo?.email || order.user?.email;
    const phone = getPhone(order);
    const address = buildFullAddress(order);
    const items = order.items.map(i => `  • ${i.name} (${i.size}/${i.color}) x${i.quantity} — ${iqd(i.price * i.quantity)}`).join('\n');

    if (action === 'approve') {
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'تم الموافقة عبر تيليغرام' });
      await order.save();

      emailService.sendOrderStatusUpdate(order).catch((e) => logger.error('Email error:', e));

      await telegramService.answerCallback(cbId, '✅ تمت الموافقة!');
      await telegramService.editOrderMessage(chatId, msgId,
        `✅ تمت الموافقة على الطلب\n\n` +
        `📦 ${order.orderNumber}\n` +
        `👤 ${customerName}\n` +
        `📞 الهاتف: ${phone}\n` +
        `📧 الإيميل: ${customerEmail || 'N/A'}\n` +
        `📍 العنوان: ${address}\n\n` +
        `🧾 المنتجات:\n${items}\n\n` +
        `💵 الإجمالي: ${iqd(order.total)}\n\n` +
        `${customerEmail ? '✉️ تم إرسال إيميل للعميل' : '📵 لا يوجد إيميل للعميل'}`
      );
    } else if (action === 'decline') {
      order.status = 'cancelled';
      order.statusHistory.push({ status: 'cancelled', note: 'تم الرفض عبر تيليغرام' });

      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stock': item.quantity, totalSold: -item.quantity } }
        );
      }

      await order.save();

      emailService.sendOrderStatusUpdate(order).catch((e) => logger.error('Email error:', e));

      await telegramService.answerCallback(cbId, '❌ تم رفض الطلب');
      await telegramService.editOrderMessage(chatId, msgId,
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
