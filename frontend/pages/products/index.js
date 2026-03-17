import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import ProductCard from '../../components/product/ProductCard';
import api from '../../lib/api';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-averageRating', label: 'Top Rated' },
  { value: '-totalSold', label: 'Best Sellers' },
];

function ProductSkeleton() {
  return (
    <div>
      <div className="aspect-[3/4] skeleton mb-4" />
      <div className="h-4 skeleton mb-2 w-3/4" />
      <div className="h-3 skeleton w-1/2" />
    </div>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    sizes: [],
    sort: '-createdAt',
    search: '',
    page: 1,
  });

  // Sync URL params
  useEffect(() => {
    const { category, filter, search, sort } = router.query;
    setFilters((f) => ({
      ...f,
      category: category || '',
      search: search || '',
      sort: sort || '-createdAt',
      page: 1,
    }));
  }, [router.query]);

  const { data, isLoading } = useQuery(
    ['products', filters],
    () => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sizes.length) params.append('sizes', filters.sizes.join(','));
      if (filters.search) params.append('search', filters.search);
      params.append('sort', filters.sort);
      params.append('page', filters.page);
      params.append('limit', 12);
      return api.get(`/products?${params}`).then(r => r.data);
    },
    { keepPreviousData: true }
  );

  const { data: catData } = useQuery('categories', () => api.get('/categories').then(r => r.data));

  const products = data?.products || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;
  const categories = catData?.categories || [];

  const toggleSize = (size) => {
    setFilters((f) => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter(s => s !== size) : [...f.sizes, size],
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({ category: '', minPrice: '', maxPrice: '', sizes: [], sort: '-createdAt', search: '', page: 1 });
    router.replace('/products', undefined, { shallow: true });
  };

  const FilterPanel = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-xs tracking-widest uppercase font-medium mb-4">Category</h3>
        <div className="space-y-2">
          <button
            onClick={() => setFilters(f => ({ ...f, category: '', page: 1 }))}
            className={`block text-sm w-full text-left py-1 transition-colors ${!filters.category ? 'text-brand-gold font-medium' : 'text-brand-warm-gray hover:text-brand-black'}`}
          >
            All Dresses
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setFilters(f => ({ ...f, category: cat._id, page: 1 }))}
              className={`block text-sm w-full text-left py-1 transition-colors ${filters.category === cat._id ? 'text-brand-gold font-medium' : 'text-brand-warm-gray hover:text-brand-black'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs tracking-widest uppercase font-medium mb-4">Price Range</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value, page: 1 }))}
            className="input-luxury text-xs py-2"
          />
          <span className="self-center text-brand-warm-gray">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value, page: 1 }))}
            className="input-luxury text-xs py-2"
          />
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h3 className="text-xs tracking-widest uppercase font-medium mb-4">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`w-10 h-10 text-xs font-medium border transition-all duration-200 ${
                filters.sizes.includes(size)
                  ? 'bg-brand-black text-white border-brand-black'
                  : 'border-brand-black/20 text-brand-warm-gray hover:border-brand-black hover:text-brand-black'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <button onClick={clearFilters} className="text-xs text-brand-warm-gray hover:text-brand-gold underline underline-offset-2 transition-colors">
        Clear all filters
      </button>
    </div>
  );

  return (
    <Layout>
      <NextSeo title="All Dresses" description="Browse our complete collection of luxury women's dresses." />

      <div className="container-luxury py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="section-title">
              {filters.search ? `"${filters.search}"` : 'All Dresses'}
            </h1>
            {!isLoading && (
              <p className="text-xs text-brand-warm-gray mt-1">{total} pieces</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <select
              value={filters.sort}
              onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value, page: 1 }))}
              className="input-luxury text-xs py-2 w-48 cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="lg:hidden btn-outline py-2 px-4 text-xs"
            >
              Filters {(filters.sizes.length || filters.category || filters.minPrice) ? '●' : ''}
            </button>
          </div>
        </div>

        <div className="flex gap-12">
          {/* Sidebar filter (desktop) */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <FilterPanel />
          </aside>

          {/* Mobile filter drawer */}
          <AnimatePresence>
            {filterOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFilterOpen(false)} className="fixed inset-0 bg-black/40 z-40 lg:hidden" />
                <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween' }} className="fixed left-0 top-0 h-full w-72 bg-white z-50 p-8 overflow-y-auto lg:hidden">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="font-display text-xl">Filters</h2>
                    <button onClick={() => setFilterOpen(false)}>✕</button>
                  </div>
                  <FilterPanel />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Products grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="font-display text-3xl mb-4 text-brand-warm-gray">No pieces found</p>
                <p className="text-sm text-brand-warm-gray mb-8">Try adjusting your filters</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-14">
                    <button
                      onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                      disabled={filters.page === 1}
                      className="w-10 h-10 border border-brand-black/20 disabled:opacity-30 hover:border-brand-gold transition-colors text-sm"
                    >
                      ←
                    </button>
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setFilters(f => ({ ...f, page: p }))}
                        className={`w-10 h-10 border text-xs font-medium transition-colors ${
                          filters.page === p
                            ? 'bg-brand-black text-white border-brand-black'
                            : 'border-brand-black/20 hover:border-brand-gold text-brand-warm-gray'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                      disabled={filters.page === pages}
                      className="w-10 h-10 border border-brand-black/20 disabled:opacity-30 hover:border-brand-gold transition-colors text-sm"
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
