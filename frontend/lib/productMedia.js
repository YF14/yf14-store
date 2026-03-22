/** Treat empty/missing as "shared" (all colors). */
export function isSharedProductMedia(m) {
  return !m?.color || String(m.color).trim() === '';
}

/**
 * Gallery for PDP: shared media always; plus media tagged with selectedColor when set.
 * Falls back to shared-only, then full product media if a color has no assets.
 */
export function filterProductGallery(images = [], videos = [], selectedColor) {
  const imgs = [...images];
  const vids = [...(videos || [])];

  if (!selectedColor) {
    const si = imgs.filter(isSharedProductMedia);
    const sv = vids.filter(isSharedProductMedia);
    if (si.length + sv.length > 0) return { images: si, videos: sv };
    return { images: imgs, videos: vids };
  }

  const matchColor = (m) => isSharedProductMedia(m) || m.color === selectedColor;
  let fi = imgs.filter(matchColor);
  let fv = vids.filter(matchColor);
  if (fi.length + fv.length === 0) {
    const si = imgs.filter(isSharedProductMedia);
    const sv = vids.filter(isSharedProductMedia);
    if (si.length + sv.length > 0) return { images: si, videos: sv };
    return { images: imgs, videos: vids };
  }
  return { images: fi, videos: fv };
}

function listingImagePool(product) {
  const imgs = product?.images || [];
  if (!imgs.length) return [];
  const shared = imgs.filter(isSharedProductMedia);
  return shared.length ? shared : imgs;
}

/** Card / listing: prefer shared images, then any. */
export function pickListingImageUrl(product) {
  const pool = listingImagePool(product);
  if (!pool.length) return '';
  const p = pool.find((i) => i.isPrimary) || pool[0];
  return p.url || '';
}

export function pickListingSecondImageUrl(product) {
  const pool = listingImagePool(product);
  const primary = pool.find((i) => i.isPrimary) || pool[0];
  const rest = pool.filter((i) => i !== primary);
  return rest[0]?.url || '';
}

export function pickListingVideoUrl(product) {
  const vids = product?.videos || [];
  if (!vids.length) return '';
  const shared = vids.find(isSharedProductMedia);
  return (shared || vids[0])?.url || '';
}

/** Cart / line item when product is populated: match variant color when possible. */
export function pickImageUrlForVariantColor(product, colorName, storedLineImage) {
  if (storedLineImage) return storedLineImage;
  const imgs = product?.images || [];
  if (!imgs.length) return '';
  const c = String(colorName || '').trim();
  if (!c) return pickListingImageUrl(product);

  const forColor = imgs.filter((i) => isSharedProductMedia(i) || i.color === c);
  const pool = forColor.length ? forColor : imgs.filter(isSharedProductMedia);
  const final = pool.length ? pool : imgs;
  const p = final.find((i) => i.isPrimary) || final[0];
  return p?.url || '';
}
