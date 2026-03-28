import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import useCartStore from '../../store/cartStore';
import { useLang } from '../../contexts/LanguageContext';
import { formatIQD } from '../../lib/currency';
import { DELIVERY_FEE_IQD } from '../../lib/deliveryFee';
import { IMAGE_BLUR_DATA_URL, optimizeRemoteImageSrc } from '../../lib/remoteImage';

export default function CartDrawer() {
  const {
    cart, guestItems, isOpen, setOpen,
    updateItem, removeItem, applyPromo, removePromo,
    activePromoCode, activePromoDiscount,
  } = useCartStore();
  const subtotal = useCartStore((s) => s.subtotal());
  const { t, isRTL } = useLang();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const prevItemCountRef = useRef(-1);

  // Determine active items (server or guest)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const items = token ? (cart?.items || []) : guestItems;
  const promoCode = typeof activePromoCode === 'function' ? activePromoCode() : activePromoCode;
  const discount = typeof activePromoDiscount === 'function' ? activePromoDiscount() : (activePromoDiscount || 0);

  const total = subtotal - discount + DELIVERY_FEE_IQD;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, setOpen]);

  // After last item is removed, close drawer so checkout isn’t blocked by an empty panel
  useEffect(() => {
    const n = items.length;
    const prev = prevItemCountRef.current;
    prevItemCountRef.current = n;
    if (isOpen && prev > 0 && n === 0) setOpen(false);
  }, [items.length, isOpen, setOpen]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const result = await applyPromo(couponCode.trim());
    if (result.success) setCouponCode('');
    setCouponLoading(false);
  };

  const slideDir = isRTL
    ? { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm touch-manipulation"
          />
          <motion.div
            {...slideDir}
            transition={{ type: 'tween', duration: 0.35 }}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-[100dvh] max-h-[100dvh] w-full sm:max-w-md bg-white z-50 flex flex-col shadow-2xl pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] touch-manipulation`}
          >
            {/* Header — close always visible (incl. empty cart) */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-brand-black/10 shrink-0">
              <h2 className="font-display text-xl font-light tracking-wide min-w-0">
                {t.cart.title}
                {items.length > 0 && (
                  <span className="ms-2 font-body text-sm text-brand-warm-gray">({items.length})</span>
                )}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.common.close}
                className="shrink-0 p-2.5 -m-1 rounded-lg text-brand-warm-gray hover:text-brand-black hover:bg-black/[0.06] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-6">
                  <div className="w-20 h-20 border-2 border-brand-gold/30 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-warm-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="w-full max-w-xs">
                    <p className="font-display text-xl mb-2">{t.cart.empty}</p>
                    <p className="text-sm text-brand-warm-gray mb-6">{t.cart.emptyText}</p>
                    <div className="flex flex-col gap-3">
                      <Link href="/products" onClick={() => setOpen(false)} className="btn-primary text-center">
                        {t.home.heroCta}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="w-full py-3 text-sm text-brand-warm-gray hover:text-brand-black border border-brand-black/15 rounded-md hover:bg-black/[0.03] transition-colors"
                      >
                        {t.common.close}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => {
                    // Support both server cart items (have item.product) and guest items
                    const imgUrl = item.image || item.product?.images?.[0]?.url || '';
                    const itemSlug = item.product?.slug || null;
                    const lineKey = item._id || item.variantId;
                    const meas =
                      item.customerHeightCm != null && item.customerWeightKg != null
                        ? t.product.cartMeasurements.replace('{h}', String(item.customerHeightCm)).replace('{w}', String(item.customerWeightKg))
                        : null;
                    return (
                      <div key={lineKey} className="flex gap-3 sm:gap-4">
                        <div className="w-[72px] h-[90px] sm:w-20 sm:h-28 bg-gray-50 flex-shrink-0 relative overflow-hidden rounded">
                          {imgUrl && (
                            <Image
                              src={optimizeRemoteImageSrc(imgUrl, { maxWidth: 240, quality: 75 })}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                              loading="lazy"
                              placeholder="blur"
                              blurDataURL={IMAGE_BLUR_DATA_URL}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {itemSlug ? (
                            <Link
                              href={`/products/${itemSlug}`}
                              onClick={() => setOpen(false)}
                              className="font-body text-sm font-medium hover:text-brand-gold transition-colors line-clamp-2"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <p className="font-body text-sm font-medium line-clamp-2">{item.name}</p>
                          )}
                          <p className="text-xs text-brand-warm-gray mt-1">
                            {item.size} · {item.color}
                          </p>
                          {meas && <p className="text-[11px] text-brand-warm-gray/90 mt-0.5">{meas}</p>}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-brand-black/20 rounded">
                              <button
                                onClick={() => updateItem(lineKey, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center text-brand-warm-gray hover:text-brand-black transition-colors"
                              >−</button>
                              <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateItem(lineKey, item.quantity + 1)}
                                disabled={item.stock !== undefined && item.quantity >= item.stock}
                                className="w-7 h-7 flex items-center justify-center text-brand-warm-gray hover:text-brand-black transition-colors disabled:opacity-40"
                              >+</button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold">{formatIQD(item.price * item.quantity)}</span>
                              <button onClick={() => removeItem(lineKey)} className="text-brand-warm-gray hover:text-red-500 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-brand-black/10 px-4 sm:px-6 py-4 sm:py-5 space-y-4">

                {/* Coupon */}
                {promoCode ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-700">{promoCode}</span>
                    </div>
                    <button onClick={removePromo} className="text-green-600 hover:text-red-500 transition-colors text-xs">
                      {isRTL ? 'إزالة' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder={isRTL ? 'كود الخصم' : 'Coupon code'}
                      className="flex-1 px-3 py-2.5 border border-brand-black/20 text-sm focus:outline-none focus:border-brand-gold transition-colors rounded"
                      dir="ltr"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2.5 text-white text-xs font-medium rounded disabled:opacity-50 transition-all"
                      style={{ background: 'linear-gradient(135deg, #9333ea, #db2777)' }}
                    >
                      {couponLoading ? '...' : (isRTL ? 'تطبيق' : 'Apply')}
                    </button>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-brand-warm-gray">
                    <span>{t.cart.subtotal}</span>
                    <span>{formatIQD(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-brand-warm-gray">
                    <span>{t.cart.shipping}</span>
                    <span>{formatIQD(DELIVERY_FEE_IQD)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>{isRTL ? 'الخصم' : 'Discount'} ({promoCode})</span>
                      <span>−{formatIQD(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-brand-black pt-2 border-t border-brand-black/10">
                    <span className="text-xs uppercase tracking-wider">{t.cart.total}</span>
                    <span className="text-base">{formatIQD(total)}</span>
                  </div>
                </div>

                <p className="text-xs text-brand-warm-gray text-center" dir={isRTL ? 'rtl' : 'ltr'}>
                  {isRTL
                    ? `🚚 التوصيل ${formatIQD(DELIVERY_FEE_IQD)} — الدفع عند الاستلام`
                    : `🚚 Delivery ${formatIQD(DELIVERY_FEE_IQD)} — cash on delivery`}
                </p>

                <Link href="/checkout" onClick={() => setOpen(false)} className="btn-primary w-full text-center block">
                  {isRTL ? 'إتمام الطلب' : 'Checkout'} →
                </Link>
                <button onClick={() => setOpen(false)} className="w-full text-center text-sm text-brand-warm-gray hover:text-brand-black transition-colors py-1">
                  {t.cart.continueShopping}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
