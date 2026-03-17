const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
  } catch (err) {
    logger.error('Email send error:', err);
  }
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
  .header h1 { color: #c9a96e; font-size: 28px; margin: 0; letter-spacing: 4px; font-weight: 300; text-transform: uppercase; }
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
    <h1>Maison Élara</h1>
    <p>The Art of Feminine Elegance</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Maison Élara. All rights reserved.</p>
    <p>Questions? Contact us at <a href="mailto:support@maisonelara.com">support@maisonelara.com</a></p>
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

  await sendEmail({
    to: order.user.email,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html: baseTemplate(`
      <h2 style="color:#1a1a1a;font-weight:300;letter-spacing:2px;">Order Confirmed</h2>
      <p style="color:#555;">Thank you, ${order.user.firstName}! Your order <strong>${order.orderNumber}</strong> has been received.</p>
      <table class="order-table">
        <thead><tr><th>Item</th><th>Variant</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>
          ${itemsHtml}
          <tr><td colspan="3">Shipping</td><td>$${order.shippingCost.toFixed(2)}</td></tr>
          <tr><td colspan="3">Tax</td><td>$${order.tax.toFixed(2)}</td></tr>
          ${order.promoDiscount ? `<tr><td colspan="3">Discount (${order.promoCode})</td><td>-$${order.promoDiscount.toFixed(2)}</td></tr>` : ''}
          <tr class="total-row"><td colspan="3">Total</td><td>$${order.total.toFixed(2)}</td></tr>
        </tbody>
      </table>
      <a href="${process.env.FRONTEND_URL}/account/orders/${order._id}" class="btn">Track Order</a>
    `),
  });
};

exports.sendOrderStatusUpdate = async (order) => {
  const statusMessages = {
    confirmed: 'Your order has been confirmed and is being prepared.',
    processing: 'Your order is currently being processed.',
    shipped: `Your order is on its way! ${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ''}`,
    delivered: 'Your order has been delivered. We hope you love it!',
    cancelled: 'Your order has been cancelled.',
  };

  const message = statusMessages[order.status] || `Your order status has been updated to: ${order.status}`;
  await sendEmail({
    to: order.user.email,
    subject: `Order Update — ${order.orderNumber}`,
    html: baseTemplate(`
      <h2 style="color:#1a1a1a;font-weight:300;letter-spacing:2px;">Order Update</h2>
      <p style="color:#555;">${message}</p>
      <p style="color:#555;">Order: <strong>${order.orderNumber}</strong></p>
      <a href="${process.env.FRONTEND_URL}/account/orders/${order._id}" class="btn">View Order</a>
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
