/**
 * Normalize cart line for UI: name, color, size, swatch, image.
 * Works for server cart (populated product + variants) and guest cart (flat fields).
 */
export function resolveCartLineDisplay(item) {
  const product = item.product;
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const vid = item.variantId != null ? String(item.variantId) : '';
  const variant = vid ? variants.find((v) => String(v._id) === vid) : null;
  const name = product?.name || item.name || '';
  const color = String(item.color || variant?.color || '').trim();
  const size = String(item.size || variant?.size || '').trim();
  const colorCode = item.colorCode || variant?.colorCode || '';
  const imageUrl = product?.images?.[0]?.url || item.image || '';
  return { name, color, size, colorCode, imageUrl };
}
