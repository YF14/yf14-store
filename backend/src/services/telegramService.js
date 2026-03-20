const logger = require('../config/logger');

const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = () => process.env.TELEGRAM_CHAT_ID;
const API       = () => `https://api.telegram.org/bot${BOT_TOKEN()}`;

async function call(method, body) {
  const res = await fetch(`${API()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) logger.error(`Telegram ${method} error:`, json);
  return json;
}

// Send new order notification with Approve / Decline buttons
exports.notifyNewOrder = async (order) => {
  if (!BOT_TOKEN() || !CHAT_ID()) return;
  try {
    const items = order.items
      .map(i => `  • ${i.name} (${i.size} / ${i.color}) x${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`)
      .join('\n');

    const addr = order.shippingAddress;
    const guest = order.guestInfo;
    const customerName = guest?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'زائر';
    const customerContact = guest?.email || guest?.phone || order.user?.email || 'N/A';
    const isGuest = !!guest;

    const addressLine = guest
      ? `${guest.city}${guest.town ? ' / ' + guest.town : ''} — 📞 ${guest.phone}`
      : addr
        ? `${addr.firstName} ${addr.lastName}, ${addr.city}, ${addr.state} — 📞 ${addr.phone || 'N/A'}`
        : 'N/A';

    const text =
      `🛍️ *طلب جديد — YF14 Store*${isGuest ? ' 👤 زائر' : ''}\n\n` +
      `📦 رقم الطلب: \`${order.orderNumber}\`\n` +
      `👤 العميل: ${customerName}\n` +
      `📞/📧 التواصل: ${customerContact}\n` +
      `📍 العنوان: ${addressLine}\n\n` +
      `🧾 *المنتجات:*\n${items}\n\n` +
      `💰 المجموع الفرعي: $${order.subtotal?.toFixed(2)}\n` +
      (order.promoDiscount > 0 ? `🏷️ خصم (${order.promoCode}): -$${order.promoDiscount?.toFixed(2)}\n` : '') +
      `🚚 الشحن: $${order.shippingCost?.toFixed(2)}\n` +
      `💵 *الإجمالي: $${order.total?.toFixed(2)}*`;

    const result = await call('sendMessage', {
      chat_id: CHAT_ID(),
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ موافقة', callback_data: `approve_${order._id}` },
          { text: '❌ رفض',   callback_data: `decline_${order._id}` },
        ]],
      },
    });

    return result;
  } catch (err) {
    logger.error('Telegram notifyNewOrder error:', err);
  }
};

// Edit the original message after manager acts
exports.editOrderMessage = async (chatId, messageId, text) => {
  try {
    await call('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
    });
  } catch (err) {
    logger.error('Telegram editMessage error:', err);
  }
};

// Answer a callback query (removes loading spinner on button)
exports.answerCallback = async (callbackQueryId, text) => {
  try {
    await call('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
  } catch (err) {
    logger.error('Telegram answerCallback error:', err);
  }
};

// Send a simple message to manager chat
exports.sendMessage = async (text) => {
  if (!BOT_TOKEN() || !CHAT_ID()) return;
  try {
    await call('sendMessage', { chat_id: CHAT_ID(), text, parse_mode: 'Markdown' });
  } catch (err) {
    logger.error('Telegram sendMessage error:', err);
  }
};

exports.notifyLowStock = async (product, variant) => {
  if (!BOT_TOKEN() || !CHAT_ID()) return;
  try {
    const text = `⚠️ *تنبيه: مخزون منخفض*\n\n${product.name}\nالمقاس: ${variant.size} | اللون: ${variant.color}\nالمتبقي: ${variant.stock} قطعة`;
    await call('sendMessage', { chat_id: CHAT_ID(), text, parse_mode: 'Markdown' });
  } catch (err) {
    logger.error('Telegram notifyLowStock error:', err);
  }
};
