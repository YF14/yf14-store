/**
 * Meta Pixel + GA4 wiring. GA events are implemented in lib/gtag.js (single source).
 */

import {
  GA_ID,
  pageView as gtagPageView,
  viewItem,
  addToCart as gtagAddToCart,
  purchase as gtagPurchase,
} from './gtag';

export const GA_MEASUREMENT_ID = GA_ID;
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

function fbqCall(...args) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
}

/**
 * SPA page view: GA4 (gtag) + Meta PageView.
 * @param {{ includeMetaPixel?: boolean }} options — set includeMetaPixel false on first load when Meta snippet already sent PageView.
 */
export function trackPageView(url, options = {}) {
  const { includeMetaPixel = true } = options;
  if (typeof window === 'undefined') return;
  const pagePath = url || `${window.location.pathname}${window.location.search || ''}`;

  if (GA_ID) {
    gtagPageView(pagePath);
  }

  if (META_PIXEL_ID && includeMetaPixel) {
    fbqCall('track', 'PageView');
  }
}

export function trackViewContent({ contentId, contentName, value, currency = 'IQD' }) {
  if (typeof window === 'undefined') return;
  const id = String(contentId || '');
  const price = Number(value) || 0;

  if (GA_ID) {
    viewItem({
      item_id: id,
      item_name: contentName || '',
      price,
      currency,
    });
  }

  if (META_PIXEL_ID) {
    fbqCall('track', 'ViewContent', {
      content_ids: id ? [id] : [],
      content_type: 'product',
      content_name: contentName || '',
      value: price,
      currency,
    });
  }
}

export function trackAddToCart({ contentId, contentName, value, quantity = 1, currency = 'IQD' }) {
  if (typeof window === 'undefined') return;
  const id = String(contentId || '');
  const qty = Math.max(1, Number(quantity) || 1);
  const lineValue = Number(value) || 0;

  if (GA_ID) {
    gtagAddToCart({
      item_id: id,
      item_name: contentName || '',
      price: qty ? lineValue / qty : lineValue,
      quantity: qty,
      currency,
    });
  }

  if (META_PIXEL_ID) {
    fbqCall('track', 'AddToCart', {
      content_ids: id ? [id] : [],
      content_type: 'product',
      content_name: contentName || '',
      value: lineValue,
      currency,
    });
  }
}

export function trackPurchase({ transactionId, value, currency = 'IQD', items = [] }) {
  if (typeof window === 'undefined') return;
  const tid = String(transactionId || '');
  const val = Number(value) || 0;

  const gaItems = items.map((i) => ({
    item_id: String(i.id || ''),
    item_name: i.name || '',
    price: Number(i.price) || 0,
    quantity: Math.max(1, Number(i.quantity) || 1),
  }));

  if (GA_ID) {
    gtagPurchase({
      transaction_id: tid,
      value: val,
      currency,
      items: gaItems.map((i) => ({
        item_id: i.item_id,
        item_name: i.item_name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  }

  if (META_PIXEL_ID) {
    fbqCall('track', 'Purchase', {
      value: val,
      currency,
      content_type: 'product',
      content_ids: gaItems.map((i) => i.item_id).filter(Boolean),
    });
  }
}
