/**
 * Registers Telegram webhook using BACKEND_URL + TELEGRAM_* from .env
 * Run from backend folder: npm run telegram:set-webhook
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const base = (process.env.BACKEND_URL || '').replace(/\/$/, '');

if (!secret || !base) {
  console.error('Missing TELEGRAM_WEBHOOK_SECRET or BACKEND_URL in .env');
  process.exit(1);
}

const url = `${base}/api/telegram/set-webhook?secret=${encodeURIComponent(secret)}`;

console.log('Calling:', url.replace(secret, '***'));

fetch(url)
  .then(async (r) => {
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Non-JSON response:', text.slice(0, 500));
      process.exit(1);
    }
    console.log(JSON.stringify(data, null, 2));
    if (data.code === 404 && data.message === 'Application not found') {
      console.error(
        '\n→ Railway is not serving this URL yet (or wrong domain). Fix deploy / DNS, then run again.'
      );
      process.exit(1);
    }
    if (data.error === 'Forbidden') {
      console.error('\n→ Wrong TELEGRAM_WEBHOOK_SECRET or server not your backend.');
      process.exit(1);
    }
    if (data.ok === false && data.description) {
      console.error('Telegram API error:', data.description);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
