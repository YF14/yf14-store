/**
 * Remote image helpers for next/image — CDN-friendly URLs + shared blur placeholder.
 * Legacy ImageKit URLs still get on-the-fly transforms; other hosts pass through unchanged.
 */

/** 10×7 neutral JPEG — lightweight blur placeholder for product/listing images */
export const IMAGE_BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHys0LTYyNDE8NDk9QE1FSTlHSU1NV0xKVVlaY2dnb3R4fHx9hYWFiYmJiP/2wBDARUXFx4aHjshIU2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjP/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

function isImageKitHost(hostname) {
  return /\.imagekit\.io$/i.test(hostname) || hostname === 'imagekit.io';
}

/**
 * Append ImageKit transform (width, quality, auto format) when missing — for old ImageKit URLs only.
 * Skips blob/data URLs and non-ImageKit hosts.
 *
 * @param {string} url
 * @param {{ maxWidth?: number, quality?: number }} [opts]
 * @returns {string}
 */
export function optimizeRemoteImageSrc(url, opts = {}) {
  const { maxWidth = 800, quality = 75 } = opts;
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  try {
    const u = new URL(url);
    if (!isImageKitHost(u.hostname)) return url;
    if (url.includes('/tr:')) return url;
    if (u.searchParams.has('tr')) return url;
    u.searchParams.set('tr', `w-${maxWidth},q-${quality},f-auto`);
    return u.toString();
  } catch {
    return url;
  }
}
