import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import Image from 'next/image';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '../../components/layout/Layout';
import HlsVideo from '../../components/media/HlsVideo';
import api from '../../lib/api';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { useLang } from '../../contexts/LanguageContext';
import { formatIQD, catName } from '../../lib/currency';
import { filterProductGallery, pickImageUrlForVariantColor, pickListingImageUrl } from '../../lib/productMedia';
import { IMAGE_BLUR_DATA_URL, optimizeRemoteImageSrc } from '../../lib/remoteImage';
import { trackViewContent } from '../../lib/analytics';

const CREAM = '#faf8f5';
const WARM_WHITE = '#f5f2ee';
const BORDER = '#e8e4de';
const CHARCOAL = '#1a1a1a';
const MUTED = '#8a8580';
const ACCENT = '#c9a96e';
const ROSE = '#d4587a';

function parseMeasure(val) {
  if (val === '' || val == null) return null;
  const n = parseFloat(String(val).trim(), 10);
  return Number.isFinite(n) ? n : NaN;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [heightInput, setHeightInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [heightError, setHeightError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [ctaShake, setCtaShake] = useState(false);
  const measureRef = useRef(null);

  const addToCart = useCartStore((s) => s.addToCart);
  const isCartLoading = useCartStore((s) => s.isLoading);
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const user = useAuthStore((s) => s.user);
  const { t, isRTL } = useLang();

  const { data, isLoading } = useQuery(
    ['product', slug],
    () => api.get(`/products/${slug}`).then((r) => r.data),
    { enabled: !!slug },
  );

  const product = data?.product;

  useEffect(() => {
    if (!product?._id) return;
    trackViewContent({
      contentId: product._id,
      contentName: product.name,
      value: product.price,
      currency: 'IQD',
    });
  }, [product?._id, product?.name, product?.price]);

  useEffect(() => {
    setActiveImg(0);
  }, [selectedColor]);

  const { images: galleryImages, videos: galleryVideos } = useMemo(
    () => filterProductGallery(product?.images || [], product?.videos || [], selectedColor),
    [product?.images, product?.videos, selectedColor],
  );

  const categorySlug = product?.category?.slug || product?.category;

  const { data: relatedData } = useQuery(
    ['related-products', categorySlug, product?._id],
    () =>
      api
        .get(`/products?category=${encodeURIComponent(categorySlug)}&limit=20&page=1&sort=categorySortOrder`)
        .then((r) => r.data),
    { enabled: !!categorySlug && !!product?._id },
  );

  const relatedPool = useMemo(() => {
    const list = relatedData?.products || [];
    return list.filter((p) => p._id !== product?._id);
  }, [relatedData?.products, product?._id]);

  /** Same category (from API); prioritize any variant color shared with this product — max 4, no tabs. */
  const productColorNames = useMemo(() => {
    const s = new Set();
    (product?.variants || []).forEach((v) => {
      if (v.color) s.add(v.color);
    });
    return s;
  }, [product?.variants]);

  const relatedDisplay = useMemo(() => {
    if (!relatedPool.length) return [];
    const colorMatch = [];
    const rest = [];
    for (const p of relatedPool) {
      const sharesColor = productColorNames.size > 0
        && p.variants?.some((v) => productColorNames.has(v.color));
      if (sharesColor) colorMatch.push(p);
      else rest.push(p);
    }
    return [...colorMatch, ...rest].slice(0, 4);
  }, [relatedPool, productColorNames]);

  const validateHeightField = useCallback((raw) => {
    if (raw === '') {
      setHeightError('');
      return true;
    }
    const v = parseMeasure(raw);
    if (!Number.isFinite(v) || v < 100 || v > 220) {
      setHeightError(t.product.heightInvalid);
      return false;
    }
    setHeightError('');
    return true;
  }, [t.product.heightInvalid]);

  const validateWeightField = useCallback((raw) => {
    if (raw === '') {
      setWeightError('');
      return true;
    }
    const v = parseMeasure(raw);
    if (!Number.isFinite(v) || v < 30 || v > 200) {
      setWeightError(t.product.weightInvalid);
      return false;
    }
    setWeightError('');
    return true;
  }, [t.product.weightInvalid]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
          <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-10 grid lg:grid-cols-2 gap-12">
            <div className="aspect-[3/4] rounded bg-black/5 animate-pulse" />
            <div className="space-y-4 pt-4">
              <div className="h-6 bg-black/5 rounded w-1/4 animate-pulse" />
              <div className="h-12 bg-black/5 rounded w-3/4 animate-pulse" />
              <div className="h-8 bg-black/5 rounded w-1/3 animate-pulse" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container-luxury py-24 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
          <h1 className="font-display text-4xl mb-4">{t.product.productNotFound}</h1>
          <Link href="/products" className="btn-primary">{t.product.browseCollection}</Link>
        </div>
      </Layout>
    );
  }

  const colors = [...new Map(product.variants.map((v) => [v.color, v])).values()];
  const sizes = [...new Set(product.variants.map((v) => v.size))].filter(
    (size) => !selectedColor || product.variants.some((v) => v.color === selectedColor && v.size === size),
  );

  const selectedVariant = selectedSize && selectedColor
    ? product.variants.find((v) => v.size === selectedSize && v.color === selectedColor)
    : null;

  // Products in a hidden (unlimited-stock) category have their stock spoofed to 9999 by the API.
  // Treat any stock value >= 9999 as "unlimited" — suppress all stock-related UI for these.
  const isUnlimited = selectedVariant ? selectedVariant.stock >= 9999 : product.variants.every((v) => v.stock >= 9999);

  const isOutOfStock = !isUnlimited && (selectedVariant ? selectedVariant.stock === 0 : false);
  const isLowStock = !isUnlimited && selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3;

  // True when every variant is zero stock (product is globally OOS regardless of selection)
  const productGlobalOOS =
    !isUnlimited && product.variants.length > 0 && product.variants.every((v) => v.stock === 0);
  // Show the badge when a selected variant is OOS, or when no selection has been made yet but all stock is gone
  const showOOSBadge = isOutOfStock || (!selectedVariant && productGlobalOOS);

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const runMeasurementValidation = () => {
    let ok = true;
    if (!heightInput.trim()) {
      setHeightError(t.product.heightRequired);
      ok = false;
    } else if (!validateHeightField(heightInput)) ok = false;

    if (!weightInput.trim()) {
      setWeightError(t.product.weightRequired);
      ok = false;
    } else if (!validateWeightField(weightInput)) ok = false;

    if (!ok) {
      setCtaShake(true);
      setTimeout(() => setCtaShake(false), 450);
      measureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return ok;
  };

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) { toast.error(t.product.selectSizeColor); return; }
    if (!selectedVariant) { toast.error(t.product.variantUnavailable); return; }
    if (selectedVariant.stock < qty) { toast.error(t.product.notEnoughStock); return; }
    if (!runMeasurementValidation()) return;

    const h = parseMeasure(heightInput);
    const w = parseMeasure(weightInput);

    await addToCart(product._id, selectedVariant._id, qty, {
      name: product.name,
      image: pickImageUrlForVariantColor(product, selectedVariant.color, '') || '',
      price: selectedVariant.price || product.price,
      size: selectedVariant.size,
      color: selectedVariant.color,
      colorCode: selectedVariant.colorCode,
      stock: selectedVariant.stock,
      customerHeightCm: h,
      customerWeightKg: w,
    });
  };

  const priceRowDir = isRTL ? 'flex-row-reverse justify-end' : 'flex-row justify-start';

  return (
    <Layout>
      <NextSeo
        title={product.seoTitle || product.name}
        description={product.seoDescription || product.shortDescription}
      />

      <div className="min-h-screen" style={{ backgroundColor: CREAM }} dir={isRTL ? 'rtl' : 'ltr'}>
        <nav
          className="flex flex-wrap items-center gap-2 text-xs border-b px-3 sm:px-6 lg:px-10 py-[14px] lg:py-[18px]"
          style={{ borderColor: BORDER, color: MUTED }}
        >
          <Link href="/" className="hover:opacity-80 transition-opacity" style={{ color: MUTED }}>{t.product.home}</Link>
          <span aria-hidden>/</span>
          <Link href="/products" className="hover:opacity-80 transition-opacity" style={{ color: MUTED }}>{t.product.shopBreadcrumb}</Link>
          <span aria-hidden>/</span>
          <span style={{ color: CHARCOAL }}>{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 w-full min-w-0 min-h-0 lg:min-h-[calc(100dvh-124px)]">
          {/* Gallery — minmax(0,1fr); sticky height aligns with viewport below nav (avoids h-screen + pt mismatch crop) */}
          <div
            className="grid w-full min-w-0 min-h-0 grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[86px_minmax(0,1fr)] lg:grid-cols-[94px_minmax(0,1fr)] overflow-hidden lg:sticky lg:self-start lg:top-[124px] lg:h-[calc(100dvh-124px)] lg:max-h-[calc(100dvh-124px)]"
            style={{ backgroundColor: WARM_WHITE }}
          >
            <div
              className="flex flex-col items-center gap-2.5 py-6 px-2 lg:px-3 border-e overflow-y-auto overflow-x-hidden shrink-0 min-w-0 min-h-0 lg:max-h-[calc(100dvh-124px)]"
              style={{ backgroundColor: CREAM, borderColor: BORDER }}
            >
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className="relative w-[52px] h-[68px] sm:w-[62px] sm:h-20 shrink-0 rounded overflow-hidden border-2 transition-colors touch-manipulation"
                  style={{ borderColor: activeImg === i ? ACCENT : 'transparent' }}
                >
                  <Image
                    src={optimizeRemoteImageSrc(img.url, { maxWidth: 200, quality: 75 })}
                    alt={img.alt || product.name}
                    fill
                    className="object-cover"
                    sizes="70px"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={IMAGE_BLUR_DATA_URL}
                  />
                  {i === 0 && (
                    <span className="absolute top-1 end-1 flex flex-col gap-0.5 items-end pointer-events-none">
                      {discount > 0 && (
                        <span className="text-[9px] px-1 py-0.5 rounded text-white font-medium" style={{ backgroundColor: ROSE }}>
                          −{discount}%
                        </span>
                      )}
                      {product.isNewArrival && (
                        <span className="text-[9px] px-1 py-0.5 rounded text-white font-medium" style={{ backgroundColor: CHARCOAL }}>{t.product.badgeNew}</span>
                      )}
                    </span>
                  )}
                </button>
              ))}
              {galleryVideos.map((vid, i) => {
                const idx = galleryImages.length + i;
                return (
                  <button
                    key={`v-${i}`}
                    type="button"
                    onClick={() => setActiveImg(idx)}
                    className="relative w-[62px] h-20 shrink-0 rounded overflow-hidden border-2 bg-neutral-900 transition-colors"
                    style={{ borderColor: activeImg === idx ? ACCENT : 'transparent' }}
                  >
                    {vid.thumbnail ? (
                      <Image src={vid.thumbnail} alt="" fill className="object-cover" sizes="62px" unoptimized />
                    ) : (
                      <HlsVideo src={vid.url} className="w-full h-full object-cover" muted preload="metadata" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center text-white text-sm pointer-events-none">▶</span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-0 min-h-[80vw] lg:min-h-0 lg:h-full bg-neutral-100">
              {activeImg < galleryImages.length ? (
                <Image
                  src={optimizeRemoteImageSrc(
                    galleryImages[activeImg]?.url || galleryImages[0]?.url,
                    { maxWidth: 1400, quality: 80 }
                  )}
                  alt={product.name}
                  fill
                  priority
                  className="object-contain object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={IMAGE_BLUR_DATA_URL}
                />
              ) : (
                <HlsVideo
                  src={galleryVideos[activeImg - galleryImages.length]?.url}
                  poster={galleryVideos[activeImg - galleryImages.length]?.thumbnail || undefined}
                  className="w-full h-full object-contain object-center"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}

              {/* Out-of-stock overlay badge */}
              {showOOSBadge && (
                <span
                  key={String(showOOSBadge)}
                  className="badge-oos absolute top-4 start-4 z-10"
                  role="status"
                  aria-label={t.common.outOfStock}
                >
                  {t.common.outOfStock}
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div
            className="flex flex-col px-4 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12 pb-[max(2.5rem,env(safe-area-inset-bottom,0px)+1.5rem)] lg:pb-12 overflow-y-auto"
            style={{ color: CHARCOAL }}
          >
            {product.category && (
              <p
                className="text-[11px] font-medium uppercase tracking-[0.15em] mb-3.5"
                style={{ color: ACCENT }}
              >
                {catName(product.category, isRTL)}
              </p>
            )}

            <h1 className="font-display text-[clamp(1.75rem,3vw,2.625rem)] font-light leading-[1.15] mb-5">
              {product.name}
            </h1>

            <div className={`flex flex-wrap items-baseline gap-3 mb-3.5 ${priceRowDir}`}>
              <span className="font-display text-[2rem] font-normal" style={{ color: CHARCOAL }}>
                {formatIQD(selectedVariant ? (selectedVariant.price || product.price) : product.price)}
              </span>
              {product.comparePrice > product.price && (
                <span className="text-base line-through" style={{ color: MUTED }}>
                  {formatIQD(product.comparePrice)}
                </span>
              )}
              {discount > 0 && (
                <span
                  className="text-[11px] font-medium text-white px-2 py-0.5 rounded-full tracking-wide"
                  style={{ backgroundColor: ROSE }}
                >
                  −{discount}%
                </span>
              )}
            </div>

            {product.reviewCount > 0 && (
              <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      className="w-4 h-4"
                      style={{ color: s <= Math.round(product.averageRating) ? ACCENT : '#e5e5e5' }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm" style={{ color: MUTED }}>
                  {product.averageRating} ({product.reviewCount} {t.product.reviewsWord})
                </span>
              </div>
            )}

            <p
              className="font-display text-base italic leading-relaxed mb-8"
              style={{ color: MUTED }}
            >
              {product.shortDescription || (product.description || '').slice(0, 220)}
            </p>

            <div className="h-px w-full mb-7" style={{ backgroundColor: BORDER }} />

            {/* Color — stacked like Size: label line, then value, then controls (RTL: all start-end aligned) */}
            <div className="mb-6">
              <div className={`mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                <span className="text-[11px] tracking-[0.12em] uppercase font-medium" style={{ color: CHARCOAL }}>
                  {t.common.color}
                </span>
                {selectedColor && (
                  <span className="block text-xs mt-1" style={{ color: MUTED }}>{selectedColor}</span>
                )}
              </div>
              <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                {colors.map((v) => (
                  <button
                    key={v.color}
                    type="button"
                    onClick={() => { setSelectedColor(v.color); setSelectedSize(null); }}
                    title={v.color}
                    className="relative w-8 h-8 rounded-full border-[3px] border-transparent outline outline-2 outline-offset-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: v.colorCode || '#ccc',
                      outlineColor: selectedColor === v.color ? ACCENT : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="mb-6">
              <div className={`mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                <span className="text-[11px] tracking-[0.12em] uppercase font-medium" style={{ color: CHARCOAL }}>
                  {t.common.size}
                </span>
              </div>
              <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                {sizes.map((size) => {
                  const available = !selectedColor
                    ? product.variants.some((v) => v.size === size && v.stock > 0)
                    : product.variants.some((v) => v.size === size && v.color === selectedColor && v.stock > 0);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => available && setSelectedSize(size)}
                      disabled={!available}
                      className="w-[50px] h-[50px] text-[13px] font-medium rounded border transition-all"
                      style={{
                        borderColor: selectedSize === size ? CHARCOAL : BORDER,
                        backgroundColor: selectedSize === size ? CHARCOAL : '#fff',
                        color: selectedSize === size ? '#fff' : available ? CHARCOAL : `${MUTED}99`,
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Measurements */}
            <div ref={measureRef} className="mb-6">
              <div className={`flex items-center gap-1.5 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-rose-600 text-sm leading-none">*</span>
                <span className="text-[11px] tracking-[0.12em] uppercase font-medium" style={{ color: CHARCOAL }}>
                  {t.product.measurementsTitle}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="relative">
                    <svg
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-[1]"
                      style={{ [isRTL ? 'right' : 'left']: '14px', color: MUTED }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M12 2v20M8 6l4-4 4 4M8 18l4 4 4-4" />
                    </svg>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={heightInput}
                      onChange={(e) => {
                        setHeightInput(e.target.value);
                        validateHeightField(e.target.value);
                      }}
                      placeholder={t.product.heightPlaceholder}
                      min={100}
                      max={220}
                      className={`w-full py-3.5 rounded-md border-[1.5px] text-[15px] outline-none transition-shadow ${
                        isRTL ? 'pr-11 pl-14' : 'pl-11 pr-14'
                      }`}
                      style={{
                        borderColor: heightError ? '#c0392b' : BORDER,
                        textAlign: isRTL ? 'right' : 'left',
                        direction: isRTL ? 'rtl' : 'ltr',
                      }}
                    />
                    <span
                      className="absolute top-1/2 -translate-y-1/2 text-[11px] font-medium pointer-events-none"
                      style={{ [isRTL ? 'left' : 'right']: '14px', color: MUTED }}
                    >
                      {t.product.unitCm}
                    </span>
                  </div>
                  {heightError ? (
                    <p className="text-[11px] text-red-700 mt-1.5" dir={isRTL ? 'rtl' : 'ltr'}>{heightError}</p>
                  ) : null}
                </div>
                <div>
                  <div className="relative">
                    <svg
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-[1]"
                      style={{ [isRTL ? 'right' : 'left']: '14px', color: MUTED }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="12" cy="8" r="3" />
                      <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
                    </svg>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={weightInput}
                      onChange={(e) => {
                        setWeightInput(e.target.value);
                        validateWeightField(e.target.value);
                      }}
                      placeholder={t.product.weightPlaceholder}
                      min={30}
                      max={200}
                      className={`w-full py-3.5 rounded-md border-[1.5px] text-[15px] outline-none transition-shadow ${
                        isRTL ? 'pr-11 pl-14' : 'pl-11 pr-14'
                      }`}
                      style={{
                        borderColor: weightError ? '#c0392b' : BORDER,
                        textAlign: isRTL ? 'right' : 'left',
                        direction: isRTL ? 'rtl' : 'ltr',
                      }}
                    />
                    <span
                      className="absolute top-1/2 -translate-y-1/2 text-[11px] font-medium pointer-events-none"
                      style={{ [isRTL ? 'left' : 'right']: '14px', color: MUTED }}
                    >
                      {t.product.unitKg}
                    </span>
                  </div>
                  {weightError ? (
                    <p className="text-[11px] text-red-700 mt-1.5" dir={isRTL ? 'rtl' : 'ltr'}>{weightError}</p>
                  ) : null}
                </div>
              </div>
              <p className="text-xs mt-2.5 leading-relaxed" style={{ color: MUTED }} dir={isRTL ? 'rtl' : 'ltr'}>
                {t.product.measurementHint}
              </p>
            </div>

            {isLowStock && (
              <p className="text-xs text-amber-600 mb-4 flex items-center gap-1.5" dir={isRTL ? 'rtl' : 'ltr'}>
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full shrink-0" />
                {t.product.lowStockBanner.replace('{n}', String(selectedVariant.stock))}
              </p>
            )}

            <div className="mb-2">
              <span className="text-[11px] tracking-[0.12em] uppercase font-medium block mb-3" style={{ color: CHARCOAL }}>
                {t.product.quantityLabel}
              </span>
              <div
                className="inline-flex items-stretch rounded-md overflow-hidden border-[1.5px] bg-white"
                style={{ borderColor: BORDER, direction: 'ltr' }}
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-[44px] h-[44px] sm:w-[42px] sm:h-[42px] flex items-center justify-center text-lg hover:bg-black/[0.03] transition-colors touch-manipulation"
                  style={{ color: CHARCOAL }}
                >
                  −
                </button>
                <span
                  className="min-w-[48px] flex items-center justify-center text-[15px] font-medium border-x"
                  style={{ borderColor: BORDER }}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => {
                    const maxStock = selectedVariant ? (selectedVariant.stock >= 9999 ? 99 : selectedVariant.stock) : 99;
                    return Math.min(maxStock, q + 1);
                  })}
                  disabled={!isUnlimited && selectedVariant && qty >= selectedVariant.stock}
                  className="w-[44px] h-[44px] sm:w-[42px] sm:h-[42px] flex items-center justify-center text-lg hover:bg-black/[0.03] transition-colors disabled:opacity-30 touch-manipulation"
                  style={{ color: CHARCOAL }}
                >
                  +
                </button>
              </div>
              {selectedVariant && !isUnlimited && (
                <p className={`text-xs mt-3 ${selectedVariant.stock <= 5 ? 'text-amber-600 font-medium' : ''}`} style={{ color: selectedVariant.stock <= 5 ? undefined : MUTED }}>
                  {selectedVariant.stock <= 5
                    ? `${t.product.onlyLeftPrefix} ${selectedVariant.stock} ${t.product.onlyLeftSuffix}`
                    : `${selectedVariant.stock} ${t.product.inStockLabel}`}
                </p>
              )}
            </div>

            <div className="h-px w-full my-7" style={{ backgroundColor: BORDER }} />

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isCartLoading || isOutOfStock}
                aria-label={isOutOfStock ? t.common.outOfStock : undefined}
                className={`w-full min-h-[48px] py-[17px] rounded-md text-white text-[15px] font-medium tracking-wide transition-transform disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 active:scale-[0.995] touch-manipulation ${ctaShake ? 'animate-shake' : ''}`}
                style={{ backgroundColor: ROSE }}
              >
                {isCartLoading ? t.product.adding : isOutOfStock ? t.product.outOfStock : t.product.addToBag}
              </button>
              <button
                type="button"
                onClick={() => (user ? toggle(product._id) : router.push('/login'))}
                className="w-full min-h-[48px] py-[15px] rounded-md border-[1.5px] text-[14px] tracking-wide flex items-center justify-center gap-2 hover:bg-black/[0.02] transition-colors touch-manipulation"
                style={{ borderColor: BORDER, color: CHARCOAL }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted(product._id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {isWishlisted(product._id) ? t.product.savedToWishlist : t.product.addToWishlistBtn}
              </button>
            </div>
          </div>
        </div>

        {/* Related */}
        {categorySlug && relatedDisplay.length > 0 && (
          <section
            className="border-t px-4 sm:px-10 lg:px-12 py-12 sm:py-14 lg:py-16 pb-[max(3rem,env(safe-area-inset-bottom,0px)+2rem)]"
            style={{ borderColor: BORDER, backgroundColor: WARM_WHITE }}
          >
            <div className="max-w-[1600px] mx-auto mb-8">
              <h2 className="font-display text-[1.75rem] lg:text-[2rem] font-light" style={{ color: CHARCOAL }}>
                {t.product.relatedSimilar}
              </h2>
            </div>
            <div className="max-w-[1600px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
              {relatedDisplay.map((p, relIdx) => {
                const img = optimizeRemoteImageSrc(pickListingImageUrl(p), { maxWidth: 640, quality: 75 });
                const relDiscount = p.comparePrice > p.price
                  ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
                  : 0;
                const uniqueColors = [...new Map((p.variants || []).map((v) => [v.color, v.colorCode])).entries()].slice(0, 4);
                return (
                  <Link
                    key={p._id}
                    href={`/products/${p.slug}`}
                    className="group rounded-[10px] overflow-hidden border bg-white transition-all hover:-translate-y-1 hover:shadow-xl"
                    style={{ borderColor: BORDER }}
                  >
                    <div className="relative h-40 md:h-[220px] bg-neutral-100">
                      {img && (
                        <Image
                          src={img}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          sizes="(max-width:768px) 50vw, 25vw"
                          priority={relIdx < 2}
                          loading={relIdx < 2 ? undefined : 'lazy'}
                          placeholder="blur"
                          blurDataURL={IMAGE_BLUR_DATA_URL}
                        />
                      )}
                      {relDiscount > 0 && (
                        <span className="absolute top-3 end-3 text-[10px] font-medium text-white px-2 py-0.5 rounded" style={{ backgroundColor: ROSE }}>
                          −{relDiscount}%
                        </span>
                      )}
                    </div>
                    <div className="px-4 py-3.5">
                      <p className="font-display text-base font-normal truncate" style={{ color: CHARCOAL }}>{p.name}</p>
                      <div className={`flex items-center gap-2 mt-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm font-medium" style={{ color: CHARCOAL }}>{formatIQD(p.price)}</span>
                        {p.comparePrice > p.price && (
                          <span className="text-xs line-through" style={{ color: MUTED }}>{formatIQD(p.comparePrice)}</span>
                        )}
                      </div>
                      {uniqueColors.length > 0 && (
                        <div className={`flex gap-1.5 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {uniqueColors.map(([colorName, code]) => (
                            <span
                              key={colorName}
                              className="w-3.5 h-3.5 rounded-full border-2 border-white shadow shrink-0"
                              style={{ backgroundColor: code || '#ccc' }}
                              title={colorName}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
