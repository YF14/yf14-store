/**
 * Smoke-test GA4 + Meta Pixel: env vars + optional HTTP fetch of the homepage.
 * Usage: node scripts/verify-analytics.js [http://localhost:3000]
 */
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const p = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

const GA = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
const META = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
const url = process.argv[2] || 'http://127.0.0.1:3000';

console.log('\n=== Analytics env (.env.local + process env) ===');
console.log('NEXT_PUBLIC_GA_MEASUREMENT_ID:', GA ? `${GA.slice(0, 12)}…` : '(not set — GA4 scripts disabled)');
console.log('NEXT_PUBLIC_META_PIXEL_ID:', META || '(not set)');

async function main() {
  console.log(`\n=== Fetch ${url} ===`);
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 12000);
    const res = await fetch(url, { redirect: 'follow', signal: ac.signal });
    clearTimeout(timer);
    const html = await res.text();
    console.log('HTTP', res.status, '— HTML length', html.length);

    const checks = [
      ['GA gtag.js URL', GA && html.includes('googletagmanager.com/gtag/js')],
      ['GA measurement id in HTML', GA && html.includes(GA)],
      ['Meta fbevents.js', html.includes('connect.facebook.net') && html.includes('fbevents')],
      ['Meta fbq init', html.includes('fbq(') && html.includes('init')],
      ['Meta pixel id in HTML', META && html.includes(META)],
      ['Meta noscript tr?id=', html.includes('facebook.com/tr?id=')],
    ];

    let ok = 0;
    let skip = 0;
    for (const [label, pass] of checks) {
      if (pass === false && (label.startsWith('GA') && !GA)) {
        console.log(`  [skip] ${label} (no GA ID)`);
        skip++;
        continue;
      }
      if (pass === false && (label.includes('Meta pixel id') && !META)) {
        console.log(`  [skip] ${label} (no Meta ID)`);
        skip++;
        continue;
      }
      const hit = Boolean(pass);
      if (hit) ok++;
      console.log(`  ${hit ? '✓' : '✗'} ${label}`);
    }

    console.log(
      '\nNote: Next.js may load some scripts only after hydration. If checks fail, open the site in a browser, DevTools → Network, filter "google" and "facebook".',
    );
    console.log('GA4 DebugView: Analytics → Admin → DebugView (Chrome extension or gtag debug).');
    console.log('Meta: Events Manager → Test events / Diagnostics.\n');

    if (!GA || !META) {
      console.log('To test both: set both IDs in frontend/.env.local and restart `npm run dev`.\n');
    }
  } catch (e) {
    console.error('Fetch failed:', e.message);
    console.log('\nStart the app: cd frontend && npm run dev\n');
    process.exitCode = 1;
  }
}

main();
