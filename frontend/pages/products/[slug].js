import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { NextSeo } from 'next-seo';
import Layout from '../../components/layout/Layout';
import api from '../../lib/api';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { useLang } from '../../contexts/LanguageContext';
import { formatIQD, catName } from '../../lib/currency';

export default function ProductDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');

  const addToCart = useCartStore((s) => s.addToCart);
  const isCartLoading = useCartStore((s) => s.isLoading);
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const user = useAuthStore((s) => s.user);
  const { isRTL } = useLang();

  const { data, isLoading, refetch } = useQuery(
    ['product', slug],
    () => api.get(`/products/${slug}`).then(r => r.data),
    { enabled: !!slug }
  );

  const product = data?.product;

  if (isLoading) {
    return (
      <Layout>
        <div className="container-luxury py-16 grid md:grid-cols-2 gap-16">
          <div className="aspect-[3/4] skeleton" />
          <div className="space-y-4 pt-8">
            <div className="h-8 skeleton w-3/4" />
            <div className="h-5 skeleton w-1/3" />
            <div className="h-4 skeleton w-full" />
            <div className="h-4 skeleton w-2/3" />
          </div>
        </div>
      </Layout>
    );
  }
  if (!product) {
    return (
      <Layout>
        <div className="container-luxury py-24 text-center">
          <h1 className="font-display text-4xl mb-4">Product Not Found</h1>
          <Link href="/products" className="btn-primary">Browse Collection</Link>
        </div>
      </Layout>
    );
  }

  // Get unique colors and sizes
  const colors = [...new Map(product.variants.map(v => [v.color, v])).values()];
  const sizes = [...new Set(product.variants.map(v => v.size))].filter(
    size => !selectedColor || product.variants.some(v => v.color === selectedColor && v.size === size)
  );

  // Find selected variant
  const selectedVariant = selectedSize && selectedColor
    ? product.variants.find(v => v.size === selectedSize && v.color === selectedColor)
    : null;

  const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : false;
  const isLowStock = selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3;

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) { toast.error(isRTL ? 'اختاري المقاس والألوان' : 'Please select size and color'); return; }
    if (!selectedVariant) { toast.error(isRTL ? 'هذا الاختيار غير متاح' : 'Variant not available'); return; }
    if (selectedVariant.stock < qty) { toast.error(isRTL ? 'الكمية المطلوبة غير متوفرة' : 'Not enough stock'); return; }
    await addToCart(product._id, selectedVariant._id, qty, {
      name: product.name,
      image: product.images?.[0]?.url || '',
      price: selectedVariant.price || product.price,
      size: selectedVariant.size,
      color: selectedVariant.color,
      colorCode: selectedVariant.colorCode,
      stock: selectedVariant.stock,
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    try {
      await api.post(`/products/${product._id}/reviews`, {
        rating: reviewRating,
        title: reviewTitle,
        body: reviewText,
      });
      toast.success('Review submitted!');
      setReviewText('');
      setReviewTitle('');
      setReviewRating(5);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    }
  };

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <Layout>
      <NextSeo
        title={product.seoTitle || product.name}
        description={product.seoDescription || product.shortDescription}
      />

      <div className="container-luxury py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-brand-warm-gray mb-8">
          <Link href="/" className="hover:text-brand-gold transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-brand-gold transition-colors">Dresses</Link>
          <span>/</span>
          <span className="text-brand-black">{product.name}</span>
        </nav>

        <div className={`grid md:grid-cols-2 gap-12 lg:gap-20 ${isRTL ? 'direction-ltr' : ''}`} dir="ltr">
          {/* Images & Videos */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            <div className="flex flex-col gap-3 w-16 flex-shrink-0">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative aspect-square overflow-hidden border-2 transition-colors ${
                    activeImg === i ? 'border-brand-gold' : 'border-transparent'
                  }`}
                >
                  <Image src={img.url} alt={img.alt || product.name} fill className="object-cover" sizes="64px" />
                </button>
              ))}
              {(product.videos || []).map((vid, i) => (
                <button
                  key={`v-${i}`}
                  onClick={() => setActiveImg(product.images.length + i)}
                  className={`relative aspect-square overflow-hidden border-2 transition-colors bg-gray-900 ${
                    activeImg === product.images.length + i ? 'border-brand-gold' : 'border-transparent'
                  }`}
                >
                  <video src={vid.url} className="w-full h-full object-cover" muted preload="metadata" />
                  <span className="absolute inset-0 flex items-center justify-center text-white text-lg">▶</span>
                </button>
              ))}
            </div>

            {/* Main image / video */}
            <div className="flex-1 relative aspect-[3/4] bg-gray-50 overflow-hidden">
              {activeImg < product.images.length ? (
                <Image
                  src={product.images[activeImg]?.url || product.images[0]?.url}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <video
                  src={product.videos?.[activeImg - product.images.length]?.url}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discount > 0 && <span className="badge badge-sale">−{discount}%</span>}
                {product.isNewArrival && <span className="badge badge-new">New</span>}
              </div>
            </div>
          </div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="py-4"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {product.category && (
              <p className="section-subtitle text-brand-warm-gray mb-3">{catName(product.category, isRTL)}</p>
            )}
            <h1 className="font-display text-4xl font-light mb-4">{product.name}</h1>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} className={`w-4 h-4 ${s <= Math.round(product.averageRating) ? 'text-brand-gold' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-brand-warm-gray">{product.averageRating} ({product.reviewCount} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-3xl">{formatIQD(product.price)}</span>
              {product.comparePrice > product.price && (
                <span className="text-lg text-brand-warm-gray line-through">{formatIQD(product.comparePrice)}</span>
              )}
            </div>

            <p className="text-sm text-brand-warm-gray leading-relaxed mb-8">{product.shortDescription || product.description.slice(0, 200)}</p>

            {/* Color selection */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs tracking-widest uppercase font-medium">Color</span>
                {selectedColor && <span className="text-xs text-brand-warm-gray">{selectedColor}</span>}
              </div>
              <div className="flex gap-3 flex-wrap">
                {colors.map((v) => (
                  <button
                    key={v.color}
                    onClick={() => { setSelectedColor(v.color); setSelectedSize(null); }}
                    title={v.color}
                    className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === v.color ? 'border-brand-gold ring-2 ring-brand-gold/30' : 'border-white ring-1 ring-black/20 hover:ring-black/40'
                    }`}
                    style={{ backgroundColor: v.colorCode || '#ccc' }}
                  />
                ))}
              </div>
            </div>

            {/* Size selection */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs tracking-widest uppercase font-medium">Size</span>
                <Link href="/size-guide" className="text-xs text-brand-warm-gray underline hover:text-brand-gold">Size Guide</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const available = !selectedColor
                    ? product.variants.some(v => v.size === size && v.stock > 0)
                    : product.variants.some(v => v.size === size && v.color === selectedColor && v.stock > 0);

                  return (
                    <button
                      key={size}
                      onClick={() => available && setSelectedSize(size)}
                      disabled={!available}
                      className={`w-12 h-12 text-xs font-medium border transition-all duration-200 ${
                        !available
                          ? 'border-brand-black/10 text-brand-black/20 cursor-not-allowed line-through'
                          : selectedSize === size
                          ? 'bg-brand-black text-white border-brand-black'
                          : 'border-brand-black/20 hover:border-brand-black text-brand-warm-gray hover:text-brand-black'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock warning */}
            {isLowStock && (
              <p className="text-xs text-amber-600 mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                Only {selectedVariant.stock} left in stock
              </p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-6 mb-8">
              <div className="flex items-center border border-brand-black/20">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 hover:bg-gray-50 transition-colors text-sm"
                >−</button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button
                  onClick={() => setQty(q => {
                    const maxStock = selectedVariant ? selectedVariant.stock : 99;
                    return Math.min(maxStock, q + 1);
                  })}
                  disabled={selectedVariant && qty >= selectedVariant.stock}
                  className="w-10 h-10 hover:bg-gray-50 transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >+</button>
              </div>
              {selectedVariant && (
                <span className={`text-xs ${selectedVariant.stock <= 5 ? 'text-amber-600 font-medium' : 'text-brand-warm-gray'}`}>
                  {selectedVariant.stock <= 5
                    ? `${isRTL ? 'آخر' : 'Only'} ${selectedVariant.stock} ${isRTL ? 'قطعة!' : 'left!'}`
                    : `${selectedVariant.stock} ${isRTL ? 'متوفر' : 'in stock'}`}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={isCartLoading || isOutOfStock}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCartLoading ? 'Adding...' : isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
              </button>
              <button
                onClick={() => user ? toggle(product._id) : router.push('/login')}
                className={`btn-outline w-full ${isWishlisted(product._id) ? 'bg-brand-black text-white' : ''}`}
              >
                {isWishlisted(product._id) ? '♥ Saved to Wishlist' : '♡ Add to Wishlist'}
              </button>
            </div>

            {/* Details */}
            <div className="border-t border-brand-black/10 pt-6 space-y-3 text-sm" dir="ltr">
              {product.material && (
                <div className="flex gap-4 items-start">
                  <span className="text-brand-warm-gray w-24 flex-shrink-0 text-xs tracking-wider uppercase pt-0.5">
                    {isRTL ? 'الخامة' : 'Material'}
                  </span>
                  <span className="text-brand-black">{product.material}</span>
                </div>
              )}
              {product.careInstructions && (
                <div className="flex gap-4 items-start">
                  <span className="text-brand-warm-gray w-24 flex-shrink-0 text-xs tracking-wider uppercase pt-0.5">
                    {isRTL ? 'العناية' : 'Care'}
                  </span>
                  <span className="text-brand-black">{product.careInstructions}</span>
                </div>
              )}
              <div className="flex gap-4 items-start">
                <span className="text-brand-warm-gray w-24 flex-shrink-0 text-xs tracking-wider uppercase pt-0.5">
                  {isRTL ? 'الشحن' : 'Shipping'}
                </span>
                <span className="text-brand-black">{isRTL ? 'مجاني فوق $100 · 3-5 أيام' : 'Free over $100 · 3-5 business days'}</span>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-brand-warm-gray w-24 flex-shrink-0 text-xs tracking-wider uppercase pt-0.5">
                  {isRTL ? 'الإرجاع' : 'Returns'}
                </span>
                <span className="text-brand-black">{isRTL ? 'إرجاع مجاني خلال 30 يوماً' : '30-day free returns'}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full Description */}
        <section className="mt-20 border-t border-brand-black/10 pt-16" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h2 className="font-display text-3xl mb-6 font-light">Product Details</h2>
              <p className="text-sm text-brand-warm-gray leading-relaxed">{product.description}</p>
            </div>
            <div>
              <h2 className="font-display text-3xl mb-6 font-light">Reviews</h2>
              {product.reviews?.length > 0 ? (
                <div className="space-y-6">
                  {product.reviews.slice(0, 5).map((r) => (
                    <div key={r._id} className="border-b border-brand-black/10 pb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <svg key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-brand-gold' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs font-medium">{r.user?.firstName} {r.user?.lastName}</span>
                        {r.verified && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5">✓ Verified</span>}
                      </div>
                      {r.title && <p className="text-sm font-medium mb-1">{r.title}</p>}
                      <p className="text-sm text-brand-warm-gray">{r.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-brand-warm-gray">No reviews yet. Be the first!</p>
              )}

              {user && (
                <form onSubmit={handleReviewSubmit} className="mt-8 border-t border-brand-black/10 pt-8">
                  <h3 className="font-display text-xl mb-4">Write a Review</h3>
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} type="button" onClick={() => setReviewRating(s)}>
                        <svg className={`w-6 h-6 ${s <= reviewRating ? 'text-brand-gold' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <input value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="Review title" className="input-luxury mb-3" />
                  <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience..." rows={4} className="input-luxury resize-none mb-4" required />
                  <button type="submit" className="btn-primary">Submit Review</button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
