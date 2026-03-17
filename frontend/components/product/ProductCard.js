import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function ProductCard({ product, index = 0 }) {
  const [imgIdx, setImgIdx] = useState(0);
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product._id));
  const user = useAuthStore((s) => s.user);

  if (!product) return null;
  const primaryImg = product.images?.[0]?.url;
  const hoverImg = product.images?.[1]?.url;
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please log in to save items'); return; }
    toggle(product._id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Link href={`/products/${product.slug}`} className="group block">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden mb-4 img-zoom">
          {primaryImg && (
            <Image
              src={imgIdx === 0 ? primaryImg : (hoverImg || primaryImg)}
              alt={product.name}
              fill
              className="object-cover transition-opacity duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && <span className="badge badge-sale">−{discount}%</span>}
            {product.isNewArrival && <span className="badge badge-new">New</span>}
            {product.isBestSeller && <span className="badge badge-bestseller">Best Seller</span>}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-8 h-8 bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-brand-black hover:text-white"
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

          {/* Quick view hover */}
          <div className="absolute bottom-0 left-0 right-0 bg-brand-black/90 py-3 text-center text-white text-xs tracking-widest uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            Quick View
          </div>

          {/* Hover image toggle */}
          {hoverImg && (
            <div
              className="absolute inset-0"
              onMouseEnter={() => setImgIdx(1)}
              onMouseLeave={() => setImgIdx(0)}
            />
          )}
        </div>

        {/* Info */}
        <div>
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
            <span className="text-sm font-medium text-brand-black">${product.price.toFixed(2)}</span>
            {product.comparePrice > product.price && (
              <span className="text-xs text-brand-warm-gray line-through">${product.comparePrice.toFixed(2)}</span>
            )}
          </div>
          {/* Color swatches */}
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
