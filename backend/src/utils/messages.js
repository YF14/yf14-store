/**
 * Customer-facing error messages in Arabic (default) and English.
 * The frontend sends the active site language as the `X-Locale` header
 * (see frontend/lib/api.js); `localeOf(req)` reads it. Use `t(locale, key, vars)`
 * to build a localized string, with {placeholders} filled from `vars`.
 */
const MESSAGES = {
  // Order / checkout
  productNotAvailable: { ar: 'هذا المنتج لم يعد متوفراً.', en: 'This product is no longer available.' },
  variantNotFound: { ar: 'الخيار المحدد غير متوفر لـ {name}.', en: 'Selected option not found for {name}.' },
  insufficientStock: { ar: 'الكمية غير كافية لـ {name} ({size}/{color}).', en: 'Insufficient stock for {name} ({size}/{color}).' },
  onlyNLeft: { ar: 'المتبقّي {n} فقط من {name} ({size}/{color}).', en: 'Only {n} left for {name} ({size}/{color}).' },
  requiredOrderFields: { ar: 'الاسم ورقم الهاتف والمحافظة والمنطقة كلها مطلوبة.', en: 'Name, phone, city and town are required.' },
  invalidPhone: { ar: 'رقم هاتف غير صالح. يجب أن يكون 07xxxxxxxxx أو 7xxxxxxxxx.', en: 'Invalid phone number. Must be 07xxxxxxxxx or 7xxxxxxxxx.' },
  cartEmpty: { ar: 'سلتك فارغة.', en: 'Your cart is empty.' },
  orderNotFound: { ar: 'الطلب غير موجود.', en: 'Order not found.' },
  notAuthorized: { ar: 'غير مصرّح بهذا الإجراء.', en: 'Not authorized.' },
  orderCannotCancel: { ar: 'لا يمكن إلغاء هذا الطلب في هذه المرحلة.', en: 'This order can no longer be cancelled at this stage.' },

  // Cart
  productNotFound: { ar: 'المنتج غير موجود.', en: 'Product not found.' },
  cartNotFound: { ar: 'السلة غير موجودة.', en: 'Cart not found.' },
  itemNotFound: { ar: 'العنصر غير موجود.', en: 'Item not found.' },
  insufficientStockShort: { ar: 'الكمية غير كافية.', en: 'Insufficient stock.' },

  // Promo
  invalidPromo: { ar: 'كود الخصم غير صالح.', en: 'Invalid promo code.' },
  promoInactive: { ar: 'كود الخصم لم يعد فعّالاً.', en: 'This promo code is no longer active.' },
  promoNotYetActive: { ar: 'كود الخصم لم يبدأ بعد.', en: 'This promo code is not yet active.' },
  promoExpired: { ar: 'انتهت صلاحية كود الخصم.', en: 'This promo code has expired.' },
  promoUsageLimit: { ar: 'وصل كود الخصم إلى حد الاستخدام.', en: 'This promo code has reached its usage limit.' },
  promoMinOrder: { ar: 'الحد الأدنى للطلب هو {amount}.', en: 'Minimum order amount is {amount}.' },
  promoAlreadyUsed: { ar: 'لقد استخدمتِ كود الخصم هذا من قبل.', en: 'You have already used this promo code.' },
};

function localeOf(req) {
  const h = req && req.headers && req.headers['x-locale'];
  return h === 'en' ? 'en' : 'ar';
}

function t(locale, key, vars = {}) {
  const entry = MESSAGES[key];
  if (!entry) return key;
  const lang = locale === 'en' ? 'en' : 'ar';
  let s = entry[lang] || entry.en;
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Format an IQD amount the same way across messages. */
function iqd(amount) {
  return `${Number(amount || 0).toLocaleString('en-US')} IQD`;
}

module.exports = { t, localeOf, iqd, MESSAGES };
