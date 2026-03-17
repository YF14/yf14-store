const logger = require('../config/logger');

exports.notifyNewOrder = async (order) => {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  try {
    const message = `🛍️ *New Order — Maison Élara*\n\nOrder: \`${order.orderNumber}\`\nCustomer: ${order.user?.firstName} ${order.user?.lastName}\nTotal: $${order.total?.toFixed(2)}\nItems: ${order.items?.length}\nStatus: ${order.status}`;
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' }),
    });
    if (!response.ok) throw new Error(`Telegram API error: ${response.statusText}`);
  } catch (err) {
    logger.error('Telegram notification error:', err);
  }
};

exports.notifyLowStock = async (product, variant) => {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  try {
    const message = `⚠️ *Low Stock Alert*\n\n${product.name}\nSize: ${variant.size} | Color: ${variant.color}\nRemaining: ${variant.stock} units`;
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' }),
    });
  } catch (err) {
    logger.error('Telegram notification error:', err);
  }
};
