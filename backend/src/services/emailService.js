const { Resend } = require('resend');
const logger = require('../config/logger');
const StoreSettings = require('../models/StoreSettings');

let resendClient;
function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const EMAIL_FROM = () => process.env.EMAIL_FROM || 'YF14 Store <orders@yf14.store>';
const STORE_INBOX = () => process.env.ORDER_NOTIFY_EMAIL || process.env.EMAIL_USER || '';
const STORE_NAME = () => process.env.STORE_NAME || 'YF14 Store';

let _cachedLogoUrl = null;
let _logoCachedAt = 0;
async function getLogoUrl() {
  const now = Date.now();
  if (_cachedLogoUrl !== null && now - _logoCachedAt < 5 * 60 * 1000) return _cachedLogoUrl;
  try {
    const settings = await StoreSettings.findOne({ key: 'site' }).select('logoUrl').lean();
    _cachedLogoUrl = settings?.logoUrl || '';
    _logoCachedAt = now;
  } catch {
    _cachedLogoUrl = '';
  }
  return _cachedLogoUrl;
}

function escapeHtml(str) {
  if (str == null || str === '') return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatIqd(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return 'IQD 0';
  return `IQD ${n.toLocaleString('en-US')}`;
}

/** Arabic RTL order confirmation (table layout for email clients). */
async function buildOrderConfirmationEmailHtml(order) {
  const gi = order.guestInfo || {};
  const sa = order.shippingAddress || {};
  const u = order.user;

  const customerFirst =
    (u && String(u.firstName || '').trim()) ||
    (gi.name && String(gi.name).trim().split(/\s+/)[0]) ||
    '';

  const governorate = gi.city || sa.city || '';
  const area = gi.town || sa.state || '';
  const phone = gi.phone || sa.phone || '';

  const orderNum = escapeHtml((order.orderNumber || '').trim() || '—');
  const sn = escapeHtml(STORE_NAME());
  const nameStrong = customerFirst ? escapeHtml(customerFirst) : 'عزيزتي';
  const gov = governorate ? escapeHtml(governorate) : '—';
  const ar = area ? escapeHtml(area) : '—';
  const ph = phone ? escapeHtml(phone) : '—';
  const totalStr = escapeHtml(formatIqd(order.total));
  const year = new Date().getFullYear();
  const logoUrl = await getLogoUrl();
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${sn}" width="56" height="56" style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;" />`
    : `<div style="width:56px;height:56px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);border-radius:50%;display:inline-block;margin-bottom:12px;"></div>`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد الطلب</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Tahoma,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <tr>
            <td align="center" style="padding-bottom:32px;">
              ${logoHtml}
              <div style="font-size:22px;font-weight:700;color:#e8e8f0;letter-spacing:0.08em;">${sn}</div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#16a34a);display:inline-flex;align-items:center;justify-content:center;font-size:32px;color:#fff;font-weight:700;">✓</div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-bottom:8px;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#e8e8f0;">تم تأكيد طلبك! 🎉</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;font-size:15px;color:#9ca3af;line-height:1.8;">
                مرحباً <strong style="color:#e8e8f0;">${nameStrong}</strong>،
                شكراً لثقتك بـ ${sn}.<br>
                سيتواصل معك فريقنا قريباً لتأكيد الطلب وتحديد موعد التوصيل.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1d2e;border:1px solid rgba(139,92,246,0.3);border-radius:16px;padding:24px;text-align:center;">
                <div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">رقم طلبك</div>
                <div style="font-size:30px;font-weight:700;color:#a78bfa;margin-bottom:6px;">${orderNum}</div>
                <div style="font-size:12px;color:#6b7280;">احتفظي بهذا الرقم لتتبع طلبك</div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1d2e;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:24px;">
                <div style="font-size:14px;font-weight:700;color:#e8e8f0;margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.07);padding-bottom:12px;">تفاصيل الطلب</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:13px;color:#9ca3af;padding:6px 0;">المحافظة</td>
                    <td style="font-size:13px;color:#e8e8f0;text-align:left;padding:6px 0;">${gov}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#9ca3af;padding:6px 0;">المنطقة</td>
                    <td style="font-size:13px;color:#e8e8f0;text-align:left;padding:6px 0;">${ar}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px;color:#9ca3af;padding:6px 0;">رقم الهاتف</td>
                    <td style="font-size:13px;color:#e8e8f0;text-align:left;padding:6px 0;">${ph}</td>
                  </tr>
                  <tr style="border-top:1px solid rgba(255,255,255,0.07);">
                    <td style="font-size:14px;font-weight:700;color:#e8e8f0;padding-top:12px;">الإجمالي</td>
                    <td style="font-size:14px;font-weight:700;color:#a78bfa;text-align:left;padding-top:12px;">${totalStr}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <tr>
            <td align="center">
              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.8;">
                ${sn} — جميع الحقوق محفوظة © ${year}<br>
                إذا لم تطلبي هذا الطلب، يرجى تجاهل هذا البريد.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const sendEmail = async ({ to, subject, html, bcc }) => {
  try {
    if (!to) {
      logger.warn('Email skipped: missing `to` address');
      return;
    }
    if (!process.env.RESEND_API_KEY) {
      logger.warn('Email skipped: RESEND_API_KEY is not set');
      return;
    }

    const payload = { from: EMAIL_FROM(), to: [to], subject, html };
    if (bcc) payload.bcc = [bcc];

    const { data, error } = await getResend().emails.send(payload);

    if (error) {
      logger.error(`Resend error: ${error.message} name=${error.name}`);
      return;
    }
    logger.info(`Email sent: subject="${subject}" to=${to}${bcc ? ` bcc=${bcc}` : ''} id=${data?.id || 'n/a'}`);
  } catch (err) {
    logger.error(`Email send error: ${err.message}`);
  }
};

exports.getSmtpStatus = async () => {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, provider: 'resend', missingEnv: ['RESEND_API_KEY'] };
  }
  try {
    const { data, error } = await getResend().domains.list();
    if (error) {
      return { ok: false, provider: 'resend', error: error.message };
    }
    const domains = (data?.data || []).map((d) => ({ name: d.name, status: d.status }));
    const allVerified = domains.length > 0 && domains.every((d) => d.status === 'verified');
    return {
      ok: allVerified,
      provider: 'resend',
      domains,
      hint: allVerified ? 'Ready to send' : 'Verify your domain in Resend dashboard',
    };
  } catch (e) {
    return { ok: false, provider: 'resend', error: e.message };
  }
};

exports.sendTestEmail = async () => {
  const to = process.env.EMAIL_USER || process.env.ORDER_NOTIFY_EMAIL;
  if (!to) throw new Error('No EMAIL_USER or ORDER_NOTIFY_EMAIL to send test to');
  const timestamp = new Date().toISOString();
  const logoUrl = await getLogoUrl();
  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM(),
    to: [to],
    subject: `${STORE_NAME()} — اختبار البريد الإلكتروني`,
    html: baseTemplate({
      logoUrl,
      icon: '✓',
      iconBg: 'linear-gradient(135deg,#22c55e,#16a34a)',
      title: 'البريد يعمل بشكل صحيح!',
      subtitle: 'Email test successful',
      content: `
        <p style="margin:0 0 8px;font-size:15px;color:#9ca3af;text-align:center;line-height:1.8;">
          تم إرسال هذا البريد بنجاح عبر Resend.
        </p>
        <p style="margin:0 0 20px;font-size:13px;color:#6b7280;text-align:center;">
          If you see this, Resend is configured correctly.
        </p>
        <div style="background:#0f1117;border-radius:8px;padding:12px 16px;text-align:center;">
          <code style="font-size:12px;color:#a78bfa;">${timestamp}</code>
        </div>
      `,
    }),
  });
  if (error) throw new Error(error.message);
  logger.info('Test email sent, id:', data?.id);
  return data;
};

/**
 * Dark base template matching the order-confirmation style.
 * @param {object} opts
 * @param {string} opts.icon       - Single emoji or character shown in the icon circle
 * @param {string} opts.iconBg     - CSS gradient/color for the icon circle background
 * @param {string} opts.title      - Main heading text (Arabic)
 * @param {string} [opts.subtitle] - Optional smaller sub-heading (English or extra info)
 * @param {string} opts.content    - Inner HTML placed inside the dark card
 * @param {string} [opts.footer]   - Optional extra footer note
 */
const baseTemplate = ({ icon, iconBg, title, subtitle = '', content, footer = '', logoUrl = '' }) => {
  const sn = escapeHtml(STORE_NAME());
  const year = new Date().getFullYear();
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${sn}" width="56" height="56" style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;" />`
    : `<div style="width:56px;height:56px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);border-radius:50%;display:inline-block;margin-bottom:12px;"></div>`;
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Tahoma,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              ${logoHtml}
              <div style="font-size:22px;font-weight:700;color:#e8e8f0;letter-spacing:0.08em;">${sn}</div>
            </td>
          </tr>

          <!-- Icon circle -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="width:72px;height:72px;border-radius:50%;background:${iconBg};display:inline-flex;align-items:center;justify-content:center;font-size:32px;color:#fff;font-weight:700;">${icon}</div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding-bottom:${subtitle ? '6px' : '24px'};">
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#e8e8f0;">${title}</h1>
            </td>
          </tr>
          ${subtitle ? `<tr><td align="center" style="padding-bottom:24px;"><p style="margin:0;font-size:13px;color:#9ca3af;">${subtitle}</p></td></tr>` : ''}

          <!-- Content card -->
          <tr>
            <td style="padding-bottom:20px;">
              <div style="background:#1a1d2e;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:28px;">
                ${content}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center">
              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.8;">
                ${sn} — جميع الحقوق محفوظة © ${year}
                ${footer ? `<br>${footer}` : ''}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

exports.sendWelcome = async (user) => {
  const name = escapeHtml(user.firstName || '');
  const logoUrl = await getLogoUrl();
  await sendEmail({
    to: user.email,
    subject: `مرحباً بكِ في ${STORE_NAME()}`,
    html: baseTemplate({
      logoUrl,
      icon: '👋',
      iconBg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
      title: `مرحباً بكِ${name ? `، ${name}` : ''}!`,
      subtitle: `Welcome to ${escapeHtml(STORE_NAME())}`,
      content: `
        <p style="margin:0 0 16px;font-size:15px;color:#9ca3af;line-height:1.8;text-align:center;">
          شكراً لانضمامك إلينا. اكتشفي تشكيلتنا المميزة من الأزياء النسائية الراقية.
        </p>
        <p style="margin:0 0 24px;font-size:13px;color:#6b7280;text-align:center;">
          Thank you for joining us. Discover our curated collection of premium women's fashion.
        </p>
        <div style="text-align:center;">
          <a href="${process.env.FRONTEND_URL}/products"
             style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;text-decoration:none;font-size:13px;font-weight:600;border-radius:10px;letter-spacing:0.05em;">
            تسوقي الآن / Shop Now
          </a>
        </div>
      `,
      footer: 'إذا لم تقومي بإنشاء هذا الحساب، يرجى تجاهل هذا البريد.',
    }),
  });
};

exports.sendOrderConfirmation = async (order) => {
  const customerEmail =
    (order.user && order.user.email) || (order.guestInfo && order.guestInfo.email);
  const storeInbox = STORE_INBOX();

  const to = customerEmail || storeInbox;
  if (!to) {
    logger.warn('sendOrderConfirmation: no customer email and no store inbox');
    return;
  }
  const subject = customerEmail
    ? `تأكيد الطلب — ${order.orderNumber}`
    : `[متجر] طلب جديد بدون بريد العميل — ${order.orderNumber}`;
  const bcc =
    customerEmail && storeInbox && customerEmail !== storeInbox ? storeInbox : undefined;

  await sendEmail({
    to,
    bcc,
    subject,
    html: await buildOrderConfirmationEmailHtml(order),
  });
};

exports.sendOrderStatusUpdate = async (order) => {
  const configs = {
    confirmed: {
      subject: `✅ تم تأكيد طلبك — ${order.orderNumber}`,
      icon: '✅',
      iconBg: 'linear-gradient(135deg,#22c55e,#16a34a)',
      titleAr: 'تم تأكيد طلبك!',
      titleEn: 'Order Confirmed',
      msgAr: 'تمت الموافقة على طلبك وسيتم التواصل معك قريباً للتوصيل.',
      msgEn: 'Your order has been approved and we will contact you soon for delivery.',
      btnText: 'عرض الطلب / View Order',
      accentColor: '#22c55e',
    },
    cancelled: {
      subject: `❌ تم إلغاء طلبك — ${order.orderNumber}`,
      icon: '✕',
      iconBg: 'linear-gradient(135deg,#ef4444,#dc2626)',
      titleAr: 'تم إلغاء طلبك',
      titleEn: 'Order Cancelled',
      msgAr: 'نأسف، تعذّر تأكيد طلبك. يرجى التواصل معنا إذا كان لديك أي استفسار.',
      msgEn: 'Sorry, your order could not be confirmed. Please contact us if you have any questions.',
      btnText: 'تواصل معنا / Contact Us',
      accentColor: '#ef4444',
    },
    processing: {
      subject: `🔄 طلبك قيد التجهيز — ${order.orderNumber}`,
      icon: '🔄',
      iconBg: 'linear-gradient(135deg,#a78bfa,#8b5cf6)',
      titleAr: 'طلبك قيد التجهيز',
      titleEn: 'Order Processing',
      msgAr: 'يتم الآن تجهيز طلبك. سنُعلمك عند الشحن.',
      msgEn: 'Your order is being prepared. We will notify you when it ships.',
      btnText: 'تتبع الطلب / Track Order',
      accentColor: '#a78bfa',
    },
    shipped: {
      subject: `🚚 طلبك في الطريق — ${order.orderNumber}`,
      icon: '🚚',
      iconBg: 'linear-gradient(135deg,#60a5fa,#2563eb)',
      titleAr: 'طلبك في الطريق!',
      titleEn: 'Order Shipped',
      msgAr: `طلبك على الطريق إليكِ!${order.trackingNumber ? ` رقم التتبع: <strong style="color:#e8e8f0;">${escapeHtml(order.trackingNumber)}</strong>` : ''}`,
      msgEn: `Your order is on its way!${order.trackingNumber ? ` Tracking: <strong style="color:#e8e8f0;">${escapeHtml(order.trackingNumber)}</strong>` : ''}`,
      btnText: 'تتبع الطلب / Track Order',
      accentColor: '#60a5fa',
    },
    delivered: {
      subject: `🎉 تم توصيل طلبك — ${order.orderNumber}`,
      icon: '🎉',
      iconBg: 'linear-gradient(135deg,#a78bfa,#8b5cf6)',
      titleAr: 'تم توصيل طلبك!',
      titleEn: 'Order Delivered',
      msgAr: 'نأمل أن تكوني سعيدة بطلبك! لا تنسي تقييم المنتج.',
      msgEn: "We hope you love your order! Don't forget to leave a review.",
      btnText: 'تقييم الطلب / Review Order',
      accentColor: '#a78bfa',
    },
  };

  const cfg = configs[order.status];
  if (!cfg) return;

  const customerEmail = (order.user && order.user.email) || (order.guestInfo && order.guestInfo.email);
  const storeInbox = STORE_INBOX();

  const to = customerEmail || storeInbox;
  if (!to) {
    logger.warn('sendOrderStatusUpdate: no customer email and no store inbox');
    return;
  }
  const subject = customerEmail ? cfg.subject : `[متجر / Store] ${cfg.subject}`;
  const bcc =
    customerEmail && storeInbox && customerEmail !== storeInbox ? storeInbox : undefined;

  const orderLink = `${process.env.FRONTEND_URL}/account/orders/${order._id}`;
  const logoUrl = await getLogoUrl();

  await sendEmail({
    to,
    bcc,
    subject,
    html: baseTemplate({
      logoUrl,
      icon: cfg.icon,
      iconBg: cfg.iconBg,
      title: cfg.titleAr,
      subtitle: cfg.titleEn,
      content: `
        <p style="margin:0 0 12px;font-size:15px;color:#9ca3af;line-height:1.8;text-align:right;">${cfg.msgAr}</p>
        <p style="margin:0 0 20px;font-size:13px;color:#6b7280;text-align:left;">${cfg.msgEn}</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr>
            <td style="font-size:13px;color:#9ca3af;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.07);">رقم الطلب / Order #</td>
            <td style="font-size:13px;color:#e8e8f0;font-weight:600;text-align:left;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.07);">${escapeHtml(order.orderNumber)}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#9ca3af;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.07);">الإجمالي / Total</td>
            <td style="font-size:13px;color:#a78bfa;font-weight:600;text-align:left;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.07);">${escapeHtml(formatIqd(order.total))}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#9ca3af;padding-top:7px;">الحالة / Status</td>
            <td style="font-size:13px;font-weight:600;color:${cfg.accentColor};text-align:left;padding-top:7px;">${cfg.titleAr} — ${cfg.titleEn}</td>
          </tr>
        </table>

        <div style="text-align:center;">
          <a href="${orderLink}"
             style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;text-decoration:none;font-size:13px;font-weight:600;border-radius:10px;letter-spacing:0.05em;">
            ${cfg.btnText}
          </a>
        </div>
      `,
    }),
  });
};

exports.sendPasswordReset = async (user, resetUrl) => {
  const logoUrl = await getLogoUrl();
  await sendEmail({
    to: user.email,
    subject: `إعادة تعيين كلمة المرور — ${STORE_NAME()}`,
    html: baseTemplate({
      logoUrl,
      icon: '🔑',
      iconBg: 'linear-gradient(135deg,#f59e0b,#d97706)',
      title: 'إعادة تعيين كلمة المرور',
      subtitle: 'Reset Your Password',
      content: `
        <p style="margin:0 0 10px;font-size:15px;color:#9ca3af;line-height:1.8;text-align:right;">
          لقد طلبتِ إعادة تعيين كلمة المرور. انقري على الزر أدناه لتعيين كلمة مرور جديدة.
        </p>
        <p style="margin:0 0 24px;font-size:13px;color:#6b7280;text-align:left;">
          You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.
        </p>
        <div style="text-align:center;margin-bottom:20px;">
          <a href="${escapeHtml(resetUrl)}"
             style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;text-decoration:none;font-size:13px;font-weight:600;border-radius:10px;letter-spacing:0.05em;">
            إعادة تعيين / Reset Password
          </a>
        </div>
      `,
      footer: 'إذا لم تطلبي هذا، يرجى تجاهل هذا البريد. — If you did not request this, please ignore this email.',
    }),
  });
};
