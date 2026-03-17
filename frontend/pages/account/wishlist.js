import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '../../components/layout/Layout';
import ProductCard from '../../components/product/ProductCard';
import useAuthStore from '../../store/authStore';
import useWishlistStore from '../../store/wishlistStore';

export default function WishlistPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const wishlist = useWishlistStore((s) => s.wishlist);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchWishlist();
  }, [user]);

  if (!user) return null;

  return (
    <Layout>
      <NextSeo title="My Wishlist" />
      <div className="container-luxury py-12">
        <Link href="/account" className="text-sm text-brand-warm-gray hover:text-brand-gold mb-6 inline-block">← Account</Link>
        <h1 className="font-display text-4xl font-light mb-10">
          My Wishlist
          {wishlist.length > 0 && <span className="font-body text-lg text-brand-warm-gray ml-3">({wishlist.length})</span>}
        </h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 border border-brand-black/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-brand-warm-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="font-display text-2xl text-brand-warm-gray mb-4">Your wishlist is empty</p>
            <p className="text-sm text-brand-warm-gray mb-8">Save your favorite pieces to revisit later</p>
            <Link href="/products" className="btn-primary">Explore Collection</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.filter(p => p && p._id).map((product, i) => (
              <ProductCard key={product._id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
