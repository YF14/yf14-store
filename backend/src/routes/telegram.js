const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const telegramService = require('../services/telegramService');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

// Telegram sends updates here
router.post('/webhook', async (req, res) => {
  res.sendStatus(200); // always reply fast so Telegram doesn't retry

  try {
    const update = req.body;

    if (!update.callback_query) return;

    const query  = update.callback_query;
    const data   = query.data; // "approve_<orderId>" or "decline_<orderId>"
    const chatId = query.message.chat.id;
    const msgId  = query.message.message_id;
    const cbId   = query.id;

    const [action, orderId] = data.split('_');
    if (!orderId || !['approve', 'decline'].includes(action)) return;

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

    if (action === 'approve') {
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'تم الموافقة عبر تيليغرام' });
      await order.save();

      if (customerEmail) {
        const emailOrder = customerEmail === order.user?.email
          ? order
          : { ...order.toObject(), user: { firstName: order.guestInfo.name, lastName: '', email: customerEmail } };
        emailService.sendOrderStatusUpdate(emailOrder).catch(e => logger.error('Email error:', e));
      }

      await telegramService.answerCallback(cbId, '✅ تمت الموافقة!');
      await telegramService.editOrderMessage(chatId, msgId,
        `✅ *تمت الموافقة على الطلب*\n\n` +
        `📦 ${order.orderNumber}\n` +
        `👤 ${customerName}\n` +
        `📞/📧 ${customerEmail || order.guestInfo?.phone || 'N/A'}\n` +
        `💵 $${order.total?.toFixed(2)}\n\n` +
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

      if (customerEmail) {
        const emailOrder = customerEmail === order.user?.email
          ? order
          : { ...order.toObject(), user: { firstName: order.guestInfo.name, lastName: '', email: customerEmail } };
        emailService.sendOrderStatusUpdate(emailOrder).catch(e => logger.error('Email error:', e));
      }

      await telegramService.answerCallback(cbId, '❌ تم رفض الطلب');
      await telegramService.editOrderMessage(chatId, msgId,
        `❌ *تم رفض الطلب*\n\n` +
        `📦 ${order.orderNumber}\n` +
        `👤 ${customerName}\n` +
        `📞/📧 ${customerEmail || order.guestInfo?.phone || 'N/A'}\n` +
        `💵 $${order.total?.toFixed(2)}\n\n` +
        `تم إعادة المخزون${customerEmail ? ' وإخطار العميل' : ''}`
      );
    }

  } catch (err) {
    logger.error('Telegram webhook error:', err);
  }
});

// Register the webhook URL with Telegram (run once after deploy)
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
