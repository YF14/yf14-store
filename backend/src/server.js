require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { requestContext, accessLog } = require('./middleware/requestLog');
const emailService = require('./services/emailService');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes = require('./routes/reviews');
const promoRoutes = require('./routes/promos');
const uploadRoutes = require('./routes/upload');
const stripeRoutes = require('./routes/stripe');
const analyticsRoutes = require('./routes/analytics');
const telegramRoutes = require('./routes/telegram');
const colorRoutes = require('./routes/colors');
const settingsRoutes = require('./routes/settings');

const app = express();

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// Rate limiting (do not throttle Telegram — shared IPs / webhooks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) =>
    req.originalUrl?.includes('/telegram/webhook') ||
    req.path?.includes('/telegram/webhook'),
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts.' }
});
app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

// Stripe webhook (needs raw body before json parsing)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// CORS — production: only FRONTEND_URL (comma-separated allowed). Dev: any localhost / 127.0.0.1 port
// (Next often uses 3001 if 3000 is taken; a single fixed origin caused "Network Error" in the browser.)
function buildCorsOrigin() {
  const listed = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return (origin, callback) => {
    if (!origin) return callback(null, true);
    if (listed.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') {
      try {
        const { hostname } = new URL(origin);
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch {
        /* ignore */
      }
    }
    callback(new Error('Not allowed by CORS'));
  };
}

app.use(cors({
  origin: buildCorsOrigin(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

app.use(requestContext);
app.use(accessLog);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SMTP diagnostics (no secrets). Use to verify Railway Variables.
app.get('/api/health/email', async (req, res) => {
  try {
    const status = await emailService.getSmtpStatus();
    res.json(status);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Send one test email to EMAIL_USER — same secret as Telegram set-webhook
app.get('/api/health/email/send-test', async (req, res) => {
  if (req.query.secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const required = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    return res.status(400).json({ ok: false, missingEnv: missing });
  }
  try {
    await emailService.sendTestEmail();
    res.json({
      ok: true,
      message: 'Sent to EMAIL_USER. Check inbox + spam folder.',
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/colors', colorRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    ...(req.requestId && { requestId: req.requestId }),
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

async function start() {
  await connectDB();
  server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    setTimeout(() => {
      emailService.getSmtpStatus().then((s) => {
        if (!s.ok) logger.warn('SMTP check:', JSON.stringify(s));
        else logger.info('SMTP check: OK (connection verified)');
      });
    }, 2000);
  });
}

start().catch((err) => {
  logger.error({ message: 'Failed to start server', err: err?.message, stack: err?.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error({
    message: 'Unhandled Rejection',
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error({
    message: 'Uncaught Exception',
    err: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

module.exports = app;
