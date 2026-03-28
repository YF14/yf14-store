require('dotenv').config();
const emailService = require('../src/services/emailService');

const TO = 'yousifadnanx1@gmail.com';

// ── Mock data ────────────────────────────────────────────────────────────────

const mockUser = {
  email: TO,
  firstName: 'يوسف',
};

const mockOrder = {
  _id: '507f1f77bcf86cd799439011',
  orderNumber: 'ORD-2026-001234',
  total: 185000,
  user: { email: TO, firstName: 'يوسف' },
  guestInfo: null,
  shippingAddress: {},
  trackingNumber: 'TRK-987654',
};

const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=sample-token-abc123`;

// ── Send all emails ───────────────────────────────────────────────────────────

async function run() {
  console.log(`\nSending all email types to: ${TO}\n${'─'.repeat(50)}`);

  const jobs = [
    {
      name: 'Welcome Email',
      fn: () => emailService.sendWelcome(mockUser),
    },
    {
      name: 'Order Confirmation',
      fn: () => emailService.sendOrderConfirmation(mockOrder),
    },
    {
      name: 'Order Status — Confirmed',
      fn: () => emailService.sendOrderStatusUpdate({ ...mockOrder, status: 'confirmed' }),
    },
    {
      name: 'Order Status — Processing',
      fn: () => emailService.sendOrderStatusUpdate({ ...mockOrder, status: 'processing' }),
    },
    {
      name: 'Order Status — Shipped',
      fn: () => emailService.sendOrderStatusUpdate({ ...mockOrder, status: 'shipped' }),
    },
    {
      name: 'Order Status — Delivered',
      fn: () => emailService.sendOrderStatusUpdate({ ...mockOrder, status: 'delivered' }),
    },
    {
      name: 'Order Status — Cancelled',
      fn: () => emailService.sendOrderStatusUpdate({ ...mockOrder, status: 'cancelled' }),
    },
    {
      name: 'Password Reset',
      fn: () => emailService.sendPasswordReset(mockUser, resetUrl),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await job.fn();
      console.log(`  ✓  ${job.name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗  ${job.name}: ${err.message}`);
      failed++;
    }
    // small delay so Resend doesn't rate-limit
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Done — ${passed} sent, ${failed} failed.\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
