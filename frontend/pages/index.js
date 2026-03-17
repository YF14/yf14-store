import { useQuery } from 'react-query';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { NextSeo } from 'next-seo';
import Layout from '../components/layout/Layout';
import ProductCard from '../components/product/ProductCard';
import api from '../lib/api';

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7 },
};

const categories = [
  { name: 'Evening Dresses', slug: 'evening-dresses', img: 'https://images.unsplash.com/photo-1566479179817-0b2d6ff88b2f?w=600&q=80' },
  { name: 'Cocktail Dresses', slug: 'cocktail-dresses', img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80' },
  { name: 'Maxi Dresses', slug: 'maxi-dresses', img: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80' },
  { name: 'Mini Dresses', slug: 'mini-dresses', img: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&q=80' },
];

export default function HomePage() {
  const { data: featuredData } = useQuery('featured', () => api.get('/products/featured').then(r => r.data));
  const { data: newData } = useQuery('new-arrivals', () => api.get('/products/new-arrivals').then(r => r.data));

  const featured = featuredData?.products || [];
  const newArrivals = newData?.products || [];

  return (
    <Layout>
      <NextSeo title="YF14 Store — The Art of Feminine Elegance" titleTemplate="%s" />

      {/* ── HERO ─────────────────────────── */}
      <section className="relative h-screen min-h-[600px] flex items-end pb-24 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&q=90"
            alt="Hero"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>

        <div className="container-luxury relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="max-w-xl"
          >
            <p className="text-white/60 text-xs tracking-[0.4em] uppercase mb-4">New Season Collection</p>
            <h1 className="font-display text-6xl md:text-8xl text-white font-light leading-none mb-6">
              Dressed in<br />
              <em>Elegance</em>
            </h1>
            <p className="text-white/80 font-body font-light text-lg mb-10 max-w-sm leading-relaxed">
              Discover our curated collection of luxury women's dresses crafted for the modern muse.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="btn-primary">
                Explore Collection
              </Link>
              <Link href="/products?filter=new" className="btn-outline border-white text-white hover:bg-white hover:text-brand-black">
                New Arrivals
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-px h-16 bg-white/40 mx-auto" />
        </motion.div>
      </section>

      {/* ── MARQUEE ─────────────────────── */}
      <div className="bg-brand-black py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="text-white/40 text-xs tracking-[0.3em] uppercase mx-8">
              Timeless Elegance ✦ Premium Quality ✦ Free Shipping $100+ ✦ New Arrivals Weekly ✦
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ──────────────────── */}
      <section className="py-24">
        <div className="container-luxury">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="section-subtitle text-brand-warm-gray mb-3">Browse by Category</p>
            <h2 className="section-title">Our Collections</h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href={`/products?category=${cat.slug}`} className="group block relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={cat.img}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4">
                    <h3 className="font-display text-xl text-white text-center font-light">{cat.name}</h3>
                    <span className="text-white/60 text-xs tracking-widest uppercase mt-1 group-hover:text-brand-gold transition-colors">
                      Shop Now →
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ───────────── */}
      {featured.length > 0 && (
        <section className="py-24 bg-white">
          <div className="container-luxury">
            <motion.div {...fadeUp} className="flex items-end justify-between mb-12">
              <div>
                <p className="section-subtitle text-brand-warm-gray mb-3">Hand-Picked</p>
                <h2 className="section-title">Featured Pieces</h2>
              </div>
              <Link href="/products?filter=featured" className="btn-ghost hidden md:flex">
                View All →
              </Link>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featured.slice(0, 8).map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
            </div>

            <div className="text-center mt-10 md:hidden">
              <Link href="/products" className="btn-outline">View All</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── EDITORIAL BANNER ────────────── */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=1400&q=80"
          alt="Editorial"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="container-luxury relative z-10 text-center">
          <motion.div {...fadeUp}>
            <p className="text-white/60 text-xs tracking-[0.4em] uppercase mb-4">Limited Edition</p>
            <h2 className="font-display text-5xl md:text-7xl text-white font-light mb-6">
              The Evening<br />Collection
            </h2>
            <p className="text-white/70 font-body font-light max-w-md mx-auto mb-10">
              Crafted for moments that matter. Where luxury meets artistry.
            </p>
            <Link href="/products?category=evening-dresses" className="btn-primary">
              Discover Now
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── NEW ARRIVALS ────────────────── */}
      {newArrivals.length > 0 && (
        <section className="py-24">
          <div className="container-luxury">
            <motion.div {...fadeUp} className="flex items-end justify-between mb-12">
              <div>
                <p className="section-subtitle text-brand-warm-gray mb-3">Just In</p>
                <h2 className="section-title">New Arrivals</h2>
              </div>
              <Link href="/products?filter=new" className="btn-ghost hidden md:flex">View All →</Link>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.slice(0, 8).map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PERKS ────────────────────────── */}
      <section className="py-16 bg-brand-cream border-y border-brand-black/10">
        <div className="container-luxury">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: '🚚', title: 'Free Shipping', desc: 'On orders over $100' },
              { icon: '↩', title: 'Easy Returns', desc: '30-day return policy' },
              { icon: '🔒', title: 'Secure Payment', desc: 'SSL encrypted checkout' },
              { icon: '✦', title: 'Luxury Quality', desc: 'Premium materials only' },
            ].map((perk) => (
              <motion.div key={perk.title} {...fadeUp} className="flex flex-col items-center gap-3">
                <span className="text-3xl">{perk.icon}</span>
                <h4 className="font-body text-sm font-medium tracking-wider uppercase">{perk.title}</h4>
                <p className="text-xs text-brand-warm-gray">{perk.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
