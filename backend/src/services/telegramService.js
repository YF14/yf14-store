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

/**
 * Iraqi checkout uses shippingAddress.city (محافظة) + shippingAddress.state (منطقة/حي);
 * guest orders also set guestInfo.city / guestInfo.town. Merge so we never skip addr when guest is {}.
 */
function buildAddress(order) {
  const guest = order.guestInfo;
  const addr = order.shippingAddress;
  const city = guest?.city || addr?.city;
  const area = guest?.town || addr?.state;
  const street = addr?.street;
  const zip = addr?.zipCode;
  const country = addr?.country;

  const parts = [];
  if (street) parts.push(String(street).trim());
  if (city) parts.push(String(city).trim());
  if (area) parts.push(String(area).trim());
  if (zip) parts.push(String(zip).trim());
  if (country && String(country).trim() && String(country).trim() !== 'IQ') {
    parts.push(String(country).trim());
  }

  const line = parts.filter(Boolean).join(' — ');
  return line || 'غير محدد';
}

function formatItemHeightWeight(item) {
  const h = item.customerHeightCm;
  const w = item.customerWeightKg;
  const bits = [];
  if (h != null && h !== '' && !Number.isNaN(Number(h))) bits.push(`طول ${Number(h)} سم`);
  if (w != null && w !== '' && !Number.isNaN(Number(w))) bits.push(`وزن ${Number(w)} كغ`);
  return bits.length ? ` (${bits.join('، ')})` : '';
}

function getPhone(order) {
  return order.guestInfo?.phone || order.shippingAddress?.phone || 'N/A';
}

function formatOrderItemsLines(order) {
  if (!order?.items?.length) return '  —';
  return order.items
    .map((i) => {
      const hw = formatItemHeightWeight(i);
      return `  • ${i.name} (${i.size} / ${i.color}) x${i.quantity}${hw} — ${iqd(i.price * i.quantity)}`;
    })
    .join('\n');
}

exports.buildOrderAddress = buildAddress;
exports.formatOrderItemsLines = formatOrderItemsLines;

exports.notifyNewOrder = async (order) => {
  if (!BOT_TOKEN() || !CHAT_ID()) return;
  try {
    const items = formatOrderItemsLines(order);

    const guest = order.guestInfo;
    const customerName = guest?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'زائر';
    const customerContact = guest?.email || guest?.phone || order.user?.email || 'N/A';
    const isGuest = Boolean(guest?.name || guest?.phone);
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
            caption: `📦 ${order.orderNumber}\n${item.name} — ${item.size} / ${item.color} x${item.quantity}${formatItemHeightWeight(item)}`,
          });
        } catch {}
      }
    }

    return result;
  } catch (err) {
    logger.error('Telegram notifyNewOrder error:', err);
  }
};

exports.editOrderMessage = async (chatId, messageId, text, replyMarkup) => {
  try {
    const body = {
      chat_id: chatId,
      message_id: messageId,
      text: String(text).slice(0, 4096),
    };
    if (replyMarkup) body.reply_markup = replyMarkup;
    await call('editMessageText', body);
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
