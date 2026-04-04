const rateLimit = require('express-rate-limit');

/** Obvious scripted clients — much lower cap than browsers (still allows legit API tools with care). */
const SCRIPT_UA =
  /(curl\/|wget\/|python-requests|aiohttp|httpx|axios\/|Go-http-client|Java\/|libwww|httpunit|nikto|masscan|zgrab|scrapy|phantomjs|headless|selenium|puppeteer)/i;

/** Crawlers we do not want to throttle (SEO / previews). */
const ALLOW_UA =
  /(googlebot|adsbot-google|mediapartners-google|bingbot|duckduckbot|facebookexternalhit|facebot|slackbot|twitterbot|linkedinbot|pinterest|applebot|yandex)/i;

function createBotLimiter() {
  if (process.env.BOT_THROTTLE_ENABLED === 'false' || process.env.BOT_THROTTLE_ENABLED === '0') {
    return (req, res, next) => next();
  }

  const max = Math.max(10, Number(process.env.BOT_RATE_LIMIT_MAX) || 45);
  const windowMs = Math.max(60_000, Number(process.env.BOT_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000);

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this client.' },
    skip: (req) => {
      if (req.method === 'OPTIONS') return true;
      if (req.originalUrl?.includes('/telegram/webhook') || req.path?.includes('/telegram/webhook')) {
        return true;
      }
      if (req.path === '/api/health' || req.originalUrl?.startsWith('/api/health')) return true;
      const ua = req.get('user-agent') || '';
      if (!ua.trim()) return false;
      if (ALLOW_UA.test(ua)) return true;
      if (!SCRIPT_UA.test(ua)) return true;
      return false;
    },
  });
}

module.exports = { createBotLimiter };
