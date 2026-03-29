/**
 * Google Analytics 4 (gtag.js) helpers — use with NEXT_PUBLIC_GA_ID (or legacy NEXT_PUBLIC_GA_MEASUREMENT_ID).
 */

export const GA_ID =
  process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

function gtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

/** GA4 recommended: page_view on SPA navigations (after gtag is loaded). */
export function pageView(pagePath) {
  if (!GA_ID || typeof window === 'undefined') return;
  const path =
    pagePath ||
    `${window.location.pathname}${window.location.search || ''}`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  gtag('event', 'page_view', {
    page_path: normalized,
    page_location: window.location?.href,
    page_title: typeof document !== 'undefined' ? document.title : undefined,
  });
}

/** Product detail */
export function viewItem({ item_id, item_name, price, currency = 'IQD' }) {
  if (!GA_ID) return;
  const p = Number(price) || 0;
  const id = String(item_id || '');
  gtag('event', 'view_item', {
    currency,
    value: p,
    items: [{ item_id: id, item_name: item_name || '', price: p, quantity: 1 }],
  });
}

/** Add to cart */
export function addToCart({ item_id, item_name, price, currency = 'IQD', quantity = 1 }) {
  if (!GA_ID) return;
  const qty = Math.max(1, Number(quantity) || 1);
  const unit = Number(price) || 0;
  gtag('event', 'add_to_cart', {
    currency,
    value: unit * qty,
    items: [
      {
        item_id: String(item_id || ''),
        item_name: item_name || '',
        price: unit,
        quantity: qty,
      },
    ],
  });
}

/**
 * Purchase / order confirmation
 * @param {{ transaction_id: string, value: number, currency?: string, items?: Array<{ item_id?: string, id?: string, item_name?: string, name?: string, price: number, quantity?: number }> }} p
 */
export function purchase({ transaction_id, value, currency = 'IQD', items = [] }) {
  if (!GA_ID) return;
  const gaItems = items.map((i) => ({
    item_id: String(i.item_id || i.id || ''),
    item_name: i.item_name || i.name || '',
    price: Number(i.price) || 0,
    quantity: Math.max(1, Number(i.quantity) || 1),
  }));
  gtag('event', 'purchase', {
    transaction_id: String(transaction_id || ''),
    value: Number(value) || 0,
    currency,
    ...(gaItems.length ? { items: gaItems } : {}),
  });
}
