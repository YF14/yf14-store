const nodemailer = require('nodemailer');
const logger = require('../config/logger');

/** Gmail app passwords are 16 chars — spaces in .env must be stripped */
let mailTransporter;
function getTransporter() {
  if (!mailTransporter) {
    const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
    const pass = (process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '');
    mailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user: process.env.EMAIL_USER, pass },
    });
  }
  return mailTransporter;
}

const sendEmail = async ({ to, subject, html, bcc }) => {
  try {
    if (!to) {
      logger.warn('Email skipped: missing `to` address');
      return;
    }
    if (!process.env.EMAIL_FROM) {
      logger.warn('Email skipped: EMAIL_FROM is not set');
      return;
    }
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      ...(bcc ? { bcc } : {}),
    });
    logger.info(`Email sent: subject="${subject}" to=${to}${bcc ? ` bcc=${bcc}` : ''} id=${info.messageId || 'n/a'}`);
  } catch (err) {
    logger.error(
      `Email send error: ${err.message} code=${err.code || 'n/a'} response=${err.response || 'n/a'}`
    );
    if (err.response) logger.error('SMTP response:', err.response);
  }
};

/** For Railway logs / dashboard: which env keys are missing, and can SMTP connect */
exports.getSmtpStatus = async () => {
  const required = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    return { ok: false, smtpConfigured: false, missingEnv: missing };
  }
  try {
    await getTransporter().verify();
    return { ok: true, smtpConfigured: true, verify: 'success' };
  } catch (e) {
    return {
      ok: false,
      smtpConfigured: true,
      verify: 'failed',
      error: e.message,
      hint: 'Check Gmail app password, 2FA, and that EMAIL_FROM matches an address Gmail allows (often same as EMAIL_USER).',
    };
  }
};

/** Sends a single test mail to EMAIL_USER — throws on failure */
exports.sendTestEmail = async () => {
  const info = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_USER,
    subject: 'YF14 Store — SMTP test',
    text: `If you see this, SMTP works. ${new Date().toISOString()}`,
    html: `<p>If you see this, SMTP works.</p><p>${new Date().toISOString()}</p>`,
  });
  logger.info('SMTP test email sent, messageId:', info.messageId);
  return info;
};

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Georgia', serif; background: #faf9f7; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 2px; overflow: hidden; box-shadow: 0 2px 20px rgba(0,0,0,0.08); }
  .header { background: #1a1a1a; padding: 40px; text-align: center; }
  .header h1 { background: linear-gradient(135deg,#9333ea,#db2777); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-size: 28px; margin: 0; letter-spacing: 4px; font-weight: 700; text-transform: uppercase; }
  .header p { color: #888; margin: 8px 0 0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
  .body { padding: 40px; }
  .footer { background: #f5f5f5; padding: 20px 40px; text-align: center; color: #999; font-size: 12px; }
  .btn { display: inline-block; padding: 14px 32px; background: #1a1a1a; color: white !important; text-decoration: none; letter-spacing: 2px; font-size: 12px; text-transform: uppercase; margin: 20px 0; }
  .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .order-table th { background: #f5f5f5; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
  .order-table td { padding: 12px 10px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  .total-row td { font-weight: bold; border-top: 2px solid #1a1a1a; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>YF14 STORE</h1>
    <p>أجعلي أطلالتكِ مميزة</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} YF14 Store. All rights reserved.</p>
    <p>Questions? Contact us at <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a></p>
  </div>
</div>
</body>
</html>`;

exports.sendWelcome = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to Maison Élara',
    html: baseTemplate(`
      <h2 style="color:#1a1a1a;font-weight:300;letter-spacing:2px;">Welcome, ${user.firstName}</h2>
      <p style="color:#555;line-height:1.8;">Thank you for joining the Maison Élara family. Discover our curated collection of premium women's fashion.</p>
      <a href="${process.env.FRONTEND_URL}/products" class="btn">Explore Collection</a>
    `),
  });
};

exports.sendOrderConfirmation = async (order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.size} / ${item.color}</td>
      <td>×${item.quantity}</td>
      <td>$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const customerEmail =
    (order.user && order.user.email) || (order.guestInfo && order.guestInfo.email);
  const firstName =
    (order.user && order.user.firstName) ||
    (order.guestInfo && order.guestInfo.name && order.guestInfo.name.trim().split(/\s+/)[0]) ||
    'Customer';
  const storeInbox =
    process.env.ORDER_NOTIFY_EMAIL || process.env.EMAIL_USER || '';

  // Customer gets the main email; store gets BCC. If guest left no email, only store receives it.
  const to = customerEmail || storeInbox;
  if (!to) {
    logger.warn('sendOrderConfirmation: no customer email and no ORDER_NOTIFY_EMAIL/EMAIL_USER');
    return;
  }
  const subject = customerEmail
    ? `Order received — ${order.orderNumber}`
    : `[Store] New guest order — ${order.orderNumber} (no customer email)`;
  const bcc =
    customerEmail && storeInbox && customerEmail !== storeInbox ? storeInbox : undefined;

  const isGuest = !order.user;
  const trackUrl = isGuest
    ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/`
    : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/orders/${order._id}`;
  const trackLabel = isGuest ? 'Visit store' : 'Track order';

  const guestBlock =
    order.guestInfo &&
    `<p style="color:#555;font-size:14px;"><strong>Phone:</strong> ${order.guestInfo.phone || '—'}<br/>
    <strong>City / area:</strong> ${order.guestInfo.city || '—'} — ${order.guestInfo.town || '—'}</p>`;

  await sendEmail({
    to,
    bcc,
    subject,
    html: baseTemplate(`
      <h2 style="color:#1a1a1a;font-weight:300;letter-spacing:2px;">Order received</h2>
      <p style="color:#555;">Thank you, ${firstName}! Your order <strong>${order.orderNumber}</strong> has been received.</p>
      ${guestBlock || ''}
      <table class="order-table">
        <thead><tr><th>Item</th><th>Variant</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>
          ${itemsHtml}
          <tr><td colspan="3">Shipping</td><td>$${(order.shippingCost ?? 0).toFixed(2)}</td></tr>
          <tr><td colspan="3">Tax</td><td>$${(order.tax ?? 0).toFixed(2)}</td></tr>
          ${order.promoDiscount ? `<tr><td colspan="3">Discount (${order.promoCode})</td><td>-$${order.promoDiscount.toFixed(2)}</td></tr>` : ''}
          <tr class="total-row"><td colspan="3">Total</td><td>$${order.total.toFixed(2)}</td></tr>
        </tbody>
      </table>
      <a href="${trackUrl}" class="btn">${trackLabel}</a>
    `),
  });
};

exports.sendOrderStatusUpdate = async (order) => {
  const configs = {
    confirmed: {
      subject: `✅ تم تأكيد طلبك — ${order.orderNumber}`,
      emoji: '✅',
      titleAr: 'تم تأكيد طلبك!',
      titleEn: 'Order Confirmed!',
      msgAr: 'تمت الموافقة على طلبك وسيتم التواصل معك قريباً للتوصيل.',
      msgEn: 'Your order has been approved and we will contact you soon for delivery.',
      btnText: 'عرض الطلب / View Order',
      color: '#16a34a',
    },
    cancelled: {
      subject: `❌ تم إلغاء طلبك — ${order.orderNumber}`,
      emoji: '❌',
      titleAr: 'تم إلغاء طلبك',
      titleEn: 'Order Cancelled',
      msgAr: 'نأسف، تعذّر تأكيد طلبك. يرجى التواصل معنا إذا كان لديك أي استفسار.',
      msgEn: 'Sorry, your order could not be confirmed. Please contact us if you have any questions.',
      btnText: 'تواصل معنا / Contact Us',
      color: '#dc2626',
    },
    processing: {
      subject: `🔄 طلبك قيد التجهيز — ${order.orderNumber}`,
      emoji: '🔄',
      titleAr: 'طلبك قيد التجهيز',
      titleEn: 'Order Processing',
      msgAr: 'يتم الآن تجهيز طلبك. سنُعلمك عند الشحن.',
      msgEn: 'Your order is being prepared. We will notify you when it ships.',
      btnText: 'تتبع الطلب / Track Order',
      color: '#9333ea',
    },
    shipped: {
      subject: `🚚 طلبك في الطريق — ${order.orderNumber}`,
      emoji: '🚚',
      titleAr: 'طلبك في الطريق!',
      titleEn: 'Order Shipped!',
      msgAr: `طلبك على الطريق إليك! ${order.trackingNumber ? `رقم التتبع: <strong>${order.trackingNumber}</strong>` : ''}`,
      msgEn: `Your order is on its way! ${order.trackingNumber ? `Tracking: <strong>${order.trackingNumber}</strong>` : ''}`,
      btnText: 'تتبع الطلب / Track Order',
      color: '#2563eb',
    },
    delivered: {
      subject: `🎉 تم توصيل طلبك — ${order.orderNumber}`,
      emoji: '🎉',
      titleAr: 'تم توصيل طلبك!',
      titleEn: 'Order Delivered!',
      msgAr: 'نأمل أن تكوني سعيدة بطلبك! لا تنسي تقييم المنتج.',
      msgEn: 'We hope you love your order! Don\'t forget to leave a review.',
      btnText: 'تقييم الطلب / Review Order',
      color: '#9333ea',
    },
  };

  const cfg = configs[order.status];
  if (!cfg) return;

  // Registered user OR guest — never rely on order.user alone (guest orders use guestInfo.email)
  const customerEmail = (order.user && order.user.email) || (order.guestInfo && order.guestInfo.email);
  const storeInbox =
    process.env.ORDER_NOTIFY_EMAIL ||
    process.env.EMAIL_USER ||
    '';

  // If no customer email, still notify the store; if customer exists, BCC store so you get a copy
  const to = customerEmail || storeInbox;
  if (!to) {
    logger.warn('sendOrderStatusUpdate: no customer email and no ORDER_NOTIFY_EMAIL/EMAIL_USER');
    return;
  }
  const subject = customerEmail ? cfg.subject : `[متجر / Store] ${cfg.subject}`;
  const bcc =
    customerEmail && storeInbox && customerEmail !== storeInbox ? storeInbox : undefined;

  await sendEmail({
    to,
    bcc,
    subject,
    html: baseTemplate(`
      <div style="text-align:center;padding:20px 0 10px;">
        <span style="font-size:48px;">${cfg.emoji}</span>
      </div>
      <h2 style="color:${cfg.color};font-weight:600;text-align:center;margin:0 0 8px;">
        ${cfg.titleAr}
      </h2>
      <p style="color:#666;text-align:center;margin:0 0 24px;font-size:13px;">${cfg.titleEn}</p>

      <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="color:#333;margin:0 0 8px;text-align:right;direction:rtl;">${cfg.msgAr}</p>
        <p style="color:#555;margin:0;font-size:13px;">${cfg.msgEn}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr style="background:#f5f5f5;">
          <td style="padding:10px;font-size:12px;color:#888;">رقم الطلب / Order #</td>
          <td style="padding:10px;font-weight:600;">${order.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding:10px;font-size:12px;color:#888;">الإجمالي / Total</td>
          <td style="padding:10px;font-weight:600;">$${order.total?.toFixed(2)}</td>
        </tr>
        <tr style="background:#f5f5f5;">
          <td style="padding:10px;font-size:12px;color:#888;">الحالة / Status</td>
          <td style="padding:10px;font-weight:600;color:${cfg.color};">${cfg.titleAr} — ${cfg.titleEn}</td>
        </tr>
      </table>

      <div style="text-align:center;margin:24px 0;">
        <a href="${process.env.FRONTEND_URL}/account/orders/${order._id}"
           style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#9333ea,#db2777);color:white;text-decoration:none;font-size:13px;border-radius:4px;">
          ${cfg.btnText}
        </a>
      </div>
    `),
  });
};

exports.sendPasswordReset = async (user, resetUrl) => {
  await sendEmail({
    to: user.email,
    subject: 'Password Reset — Maison Élara',
    html: baseTemplate(`
      <h2 style="color:#1a1a1a;font-weight:300;letter-spacing:2px;">Reset Password</h2>
      <p style="color:#555;">You requested a password reset. Click below to set a new password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p style="color:#999;font-size:12px;">If you didn't request this, please ignore this email.</p>
    `),
  });
};
