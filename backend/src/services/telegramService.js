const logger = require('../config/logger');

const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = () => process.env.TELEGRAM_CHAT_ID;
const API       = () => `https://api.telegram.org/bot${BOT_TOKEN()}`;

function iqd(v) {
  return `${Number(v || 0).toLocaleString('en-US')} IQD`;
}

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

function buildAddress(order) {
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

exports.notifyNewOrder = async (order) => {
  if (!BOT_TOKEN() || !CHAT_ID()) return;
  try {
    const items = order.items
      .map(i => `  • ${i.name} (${i.size} / ${i.color}) x${i.quantity} — ${iqd(i.price * i.quantity)}`)
      .join('\n');

    const guest = order.guestInfo;
    const customerName = guest?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'زائر';
    const customerContact = guest?.email || guest?.phone || order.user?.email || 'N/A';
    const isGuest = !!guest;
    const phone = getPhone(order);
    const address = buildAddress(order);

    const text =
      `🛍️ *طلب جديد — YF14 Store*${isGuest ? ' 👤 زائر' : ''}\n\n` +
      `📦 رقم الطلب: \`${order.orderNumber}\`\n` +
      `👤 العميل: ${customerName}\n` +
      `📞 الهاتف: ${phone}\n` +
      `📧 التواصل: ${customerContact}\n` +
      `📍 العنوان: ${address}\n\n` +
      `🧾 *المنتجات:*\n${items}\n\n` +
      `💰 المجموع: ${iqd(order.subtotal)}\n` +
      (order.promoDiscount > 0 ? `🏷️ خصم (${order.promoCode}): -${iqd(order.promoDiscount)}\n` : '') +
      `🚚 الشحن: ${iqd(order.shippingCost)}\n` +
      `💵 *الإجمالي: ${iqd(order.total)}*`;

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

    // Send product photos
    for (const item of order.items) {
      if (item.image) {
        try {
          await call('sendPhoto', {
            chat_id: CHAT_ID(),
            photo: item.image,
            caption: `${item.name} — ${item.size} / ${item.color} x${item.quantity}`,
          });
        } catch {}
      }
    }

    return result;
  } catch (err) {
    logger.error('Telegram notifyNewOrder error:', err);
  }
};

exports.editOrderMessage = async (chatId, messageId, text) => {
  try {
    await call('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: String(text).slice(0, 4096),
    });
  } catch (err) {
    logger.error('Telegram editMessage error:', err);
  }
};

exports.answerCallback = async (callbackQueryId, text) => {
  try {
    const t = text ? String(text).slice(0, 200) : undefined;
    await call('answerCallbackQuery', { callback_query_id: callbackQueryId, text: t });
  } catch (err) {
    logger.error('Telegram answerCallback error:', err);
  }
};

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
