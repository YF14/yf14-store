import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { formatIQD } from '../../lib/currency';
import { pickListingImageUrl, pickListingSecondImageUrl, pickListingVideoUrl } from '../../lib/productMedia';
import { useLang } from '../../contexts/LanguageContext';

const DEFAULT_IMAGE_SIZES = '(max-width: 640px) 50vw, 33vw';

export default function ProductCard({ product, index = 0, imageSizes = DEFAULT_IMAGE_SIZES }) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef(null);
  const { t } = useLang();
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product._id));
  const user = useAuthStore((s) => s.user);

  if (!product) return null;

  const primaryImg = pickListingImageUrl(product);
  const hoverImg = pickListingSecondImageUrl(product);
  const videoUrl = pickListingVideoUrl(product);
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  // Products in a hidden (unlimited-stock) category have stock spoofed to 9999 by the API.
  const isUnlimited =
    product.variants &&
    product.variants.length > 0 &&
    product.variants.every((v) => v.stock >= 9999);

  // True when every variant has zero stock (or no variants exist) — never true for unlimited products
  const isProductOOS =
    !isUnlimited &&
    (!product.variants ||
      product.variants.length === 0 ||
      product.variants.every((v) => v.stock === 0));

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please log in to save items'); return; }
    toggle(product._id);
  };

  const handleMouseEnter = () => {
    setHovered(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Link href={`/products/${product.slug}`} className="group block">
        <div
          className="relative aspect-square bg-gray-100 overflow-hidden rounded-t-xl mb-0"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Base image */}
          {primaryImg && (
            <Image
              src={primaryImg}
              alt={product.name}
              fill
              className={`object-contain transition-all duration-700 ${
                hovered && videoUrl
                  ? 'opacity-0'
                  : hovered && !videoUrl
                  ? hoverImg
                    ? 'opacity-0'
                    : 'scale-105'
                  : 'scale-100 opacity-100'
              }`}
              sizes={imageSizes}
            />
          )}

          {/* Hover image (when no video, swap to second image) */}
          {hoverImg && !videoUrl && (
            <Image
              src={hoverImg}
              alt={product.name}
              fill
              className={`object-contain transition-opacity duration-700 absolute inset-0 ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`}
              sizes={imageSizes}
            />
          )}

          {/* Video overlay on hover */}
          {videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {isProductOOS ? (
              <span
                className="badge-oos"
                role="status"
                aria-label={t.common.outOfStock}
              >
                {t.common.outOfStock}
              </span>
            ) : (
              <>
                {discount > 0 && <span className="badge badge-sale">−{discount}%</span>}
                {product.isNewArrival && <span className="badge badge-new">New</span>}
                {product.isBestSeller && <span className="badge badge-bestseller">Best Seller</span>}
              </>
            )}
            {videoUrl && (
              <span className="text-[9px] bg-brand-black/70 text-white px-1.5 py-0.5 backdrop-blur-sm">
                ▶ Video
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-8 h-8 bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-all duration-200 hover:bg-brand-black hover:text-white active:bg-brand-black active:text-white z-10"
          >
            <svg
              className="w-4 h-4"
              fill={isWishlisted ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Available sizes bar */}
          {(() => {
            const sizes = product.variants
              ? [...new Set(product.variants.filter(v => v.stock > 0).map(v => v.size))]
              : [];
            const sizeOrder = ['XS','S','M','L','XL','XXL','XXXL'];
            sizes.sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));
            return (
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm py-2.5 px-3 translate-y-full group-hover:translate-y-0 [@media(hover:none)]:translate-y-0 transition-transform duration-300 z-10">
                {sizes.length > 0 ? (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {sizes.map(size => (
                      <span key={size} className="text-[10px] font-medium text-brand-black tracking-wide border border-brand-black/20 px-1.5 py-0.5">
                        {size}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-center text-gray-400 tracking-widest uppercase">{t.common.outOfStock}</p>
                )}
              </div>
            );
          })()}
        </div>

        {/* Info — soft lavender panel (name, price, swatches) */}
        <div className="rounded-b-xl border border-brand-gold-light/35 bg-gradient-to-b from-brand-cream via-white to-brand-purple-light/60 px-3.5 pt-3 pb-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <h3 className="font-body text-sm font-medium text-brand-black group-hover:text-brand-gold transition-colors line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {product.averageRating > 0 && (
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} className={`w-3 h-3 ${s <= Math.round(product.averageRating) ? 'text-brand-gold' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-[10px] text-brand-warm-gray ml-1">({product.reviewCount})</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm font-medium text-brand-black">{formatIQD(product.price)}</span>
            {product.comparePrice > product.price && (
              <span className="text-xs text-brand-warm-gray line-through">{formatIQD(product.comparePrice)}</span>
            )}
          </div>
          {product.variants && (
            <div className="flex gap-1 mt-2">
              {[...new Map(product.variants.map(v => [v.color, v])).values()].slice(0, 5).map((v) => (
                <span
                  key={v.color}
                  title={v.color}
                  className="w-3 h-3 rounded-full border border-white shadow-sm ring-1 ring-black/10"
                  style={{ backgroundColor: v.colorCode || '#ccc' }}
                />
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
