import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useInfiniteQuery, useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../product/ProductCard';
import api from '../../lib/api';
import { useLang } from '../../contexts/LanguageContext';
import { catName, formatIQD } from '../../lib/currency';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free size'];
const SIZE_ORDER = Object.fromEntries(SIZES.map((sz, i) => [sz, i]));

/** Sort size facet rows: known order first, then alphabetical. */
function sortSizeAgg(rows) {
  return [...rows].sort((a, b) => {
    const ia = SIZE_ORDER[a.size];
    const ib = SIZE_ORDER[b.size];
    if (ia != null && ib != null) return ia - ib;
    if (ia != null) return -1;
    if (ib != null) return 1;
    return String(a.size).localeCompare(String(b.size), undefined, { numeric: true });
  });
}

const PAGE_SIZE = 20;

function ProductSkeleton() {
  return (
    <div>
      <div className="aspect-square skeleton mb-3 rounded-t-xl" />
      <div className="h-3.5 skeleton mb-2 w-3/4" />
      <div className="h-3 skeleton w-1/2" />
    </div>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function ShopProductListing({
  embed = false,
  homeCompact = false,
  /** Dedicated /sale route: always applies filter=sale; URLs use /sale?… */
  saleMode = false,
  /** Dedicated /featured route */
  featuredMode = false,
  /** Dedicated /new-arrivals route */
  newArrivalMode = false,
  /** Dedicated /best-sellers route */
  bestSellerMode = false,
  /** Parent page provides NextSeo (e.g. /sale) */
  skipPageSeo = false,
}) {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const s = t.shop;
  const p = t.product;
  const listPathname = saleMode
    ? '/sale'
    : featuredMode
      ? '/featured'
      : newArrivalMode
        ? '/new-arrivals'
        : bestSellerMode
          ? '/best-sellers'
          : '/products';
  const isCollectionPage = saleMode || featuredMode || newArrivalMode || bestSellerMode;

  const SORT_OPTIONS = useMemo(() => {
    const base = [
      { value: '-createdAt', label: s.newestFirst },
      { value: 'price', label: s.priceLow },
      { value: '-price', label: s.priceHigh },
      { value: '-averageRating', label: s.topRated },
      { value: '-totalSold', label: s.bestSellers },
    ];
    if (saleMode) {
      return [{ value: 'saleSortOrder', label: p.saleCuratedOrder }, ...base];
    }
    if (featuredMode) {
      return [{ value: 'featuredSortOrder', label: s.featuredCuratedOrder }, ...base];
    }
    if (newArrivalMode) {
      return [{ value: 'newArrivalSortOrder', label: s.newArrivalCuratedOrder }, ...base];
    }
    if (bestSellerMode) {
      return [{ value: 'bestSellerSortOrder', label: s.bestSellerCuratedOrder }, ...base];
    }
    return base;
  }, [saleMode, featuredMode, newArrivalMode, bestSellerMode, s, p]);

  const [filterOpen,   setFilterOpen]   = useState(false);
  const [openSections, setOpenSections] = useState({ category: true, price: true, colour: true, size: true });
  const [filters, setFilters] = useState({
    category: '', minPrice: '', maxPrice: '',
    sizes: [], colors: [], sort: '-createdAt', search: '',
    filter: saleMode ? 'sale' : featuredMode ? 'featured' : newArrivalMode ? 'new' : bestSellerMode ? 'bestSeller' : '', // URL: ?filter=…
  });
  const [priceInput, setPriceInput] = useState({ min: 0, max: 1000000 });

  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Sync URL params → filters (shop page only — home embed keeps local state)
  useEffect(() => {
    if (embed) return;
    if (saleMode) {
      const { category, search, sort } = router.query;
      const nextCat = category || '';
      let nextSort = sort;
      if (!nextSort) {
        nextSort = nextCat ? 'categorySortOrder' : 'saleSortOrder';
      }
      if (!nextCat && nextSort === 'categorySortOrder') {
        nextSort = 'saleSortOrder';
      }
      setFilters((f) => ({
        ...f,
        category: nextCat,
        search: search || '',
        sort: nextSort,
        filter: 'sale',
      }));
      return;
    }
    if (featuredMode) {
      const { category, search, sort } = router.query;
      const nextCat = category || '';
      let nextSort = sort;
      if (!nextSort) {
        nextSort = nextCat ? 'categorySortOrder' : 'featuredSortOrder';
      }
      if (!nextCat && nextSort === 'categorySortOrder') {
        nextSort = 'featuredSortOrder';
      }
      setFilters((f) => ({
        ...f,
        category: nextCat,
        search: search || '',
        sort: nextSort,
        filter: 'featured',
      }));
      return;
    }
    if (newArrivalMode) {
      const { category, search, sort } = router.query;
      const nextCat = category || '';
      let nextSort = sort;
      if (!nextSort) {
        nextSort = nextCat ? 'categorySortOrder' : 'newArrivalSortOrder';
      }
      if (!nextCat && nextSort === 'categorySortOrder') {
        nextSort = 'newArrivalSortOrder';
      }
      setFilters((f) => ({
        ...f,
        category: nextCat,
        search: search || '',
        sort: nextSort,
        filter: 'new',
      }));
      return;
    }
    if (bestSellerMode) {
      const { category, search, sort } = router.query;
      const nextCat = category || '';
      let nextSort = sort;
      if (!nextSort) {
        nextSort = nextCat ? 'categorySortOrder' : 'bestSellerSortOrder';
      }
      if (!nextCat && nextSort === 'categorySortOrder') {
        nextSort = 'bestSellerSortOrder';
      }
      setFilters((f) => ({
        ...f,
        category: nextCat,
        search: search || '',
        sort: nextSort,
        filter: 'bestSeller',
      }));
      return;
    }
    const { category, search, sort, filter } = router.query;
    const listFilter =
      filter === 'sale' || filter === 'new' || filter === 'featured' || filter === 'bestSeller' ? filter : '';
    const nextCat = category || '';
    let nextSort = sort;
    if (!nextSort) {
      nextSort = nextCat ? 'categorySortOrder' : '-createdAt';
    }
    if (!nextCat && nextSort === 'categorySortOrder') {
      nextSort = '-createdAt';
    }
    setFilters((f) => ({
      ...f,
      category: nextCat,
      search: search || '',
      sort: nextSort,
      filter: listFilter,
    }));
  }, [router.query, embed, saleMode, featuredMode, newArrivalMode, bestSellerMode]);

  // ── Products: infinite scroll (20 per page, “Load more”) ─
  const fetchProductsPage = async ({ pageParam = 1 }) => {
    const params = new URLSearchParams();
    if (filters.category)      params.append('category', filters.category);
    if (filters.minPrice)      params.append('minPrice', filters.minPrice);
    if (filters.maxPrice)      params.append('maxPrice', filters.maxPrice);
    if (filters.sizes.length)  params.append('sizes',   filters.sizes.join(','));
    if (filters.colors.length) params.append('colors',  filters.colors.join(','));
    if (filters.search)        params.append('search',  filters.search);
    if (filters.filter)        params.append('filter',   filters.filter);
    params.append('sort', filters.sort);
    params.append('page', String(pageParam));
    params.append('limit', String(PAGE_SIZE));
    return api.get(`/products?${params}`).then(r => r.data);
  };

  const {
    data: infiniteData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    [
      'products',
      embed ? 'home' : saleMode ? 'sale' : featuredMode ? 'featured' : newArrivalMode ? 'new' : bestSellerMode ? 'bestSeller' : 'page',
      filters,
    ],
    fetchProductsPage,
    {
      getNextPageParam: (lastPage) => {
        const cur = lastPage.page ?? 1;
        const totalPages = lastPage.pages ?? 1;
        return cur < totalPages ? cur + 1 : undefined;
      },
    }
  );

  const products = infiniteData?.pages.flatMap((p) => p.products) ?? [];
  const total = infiniteData?.pages[0]?.total ?? 0;

  const { data: catData }        = useQuery('categories',        () => api.get('/categories').then(r => r.data));
  const { data: priceRangeData } = useQuery(
    ['productPriceRange', filters.filter],
    () => {
      const qs = filters.filter ? `?filter=${filters.filter}` : '';
      return api.get(`/products/price-range${qs}`).then(r => r.data);
    }
  );
  const { data: colorData } = useQuery(
    ['productColors', filters.category, filters.sizes, filters.filter],
    () => {
      const params = new URLSearchParams();
      if (filters.category)     params.set('category', filters.category);
      if (filters.sizes.length) params.set('sizes',    filters.sizes.join(','));
      if (filters.filter)       params.set('filter',   filters.filter);
      const qs = params.toString();
      return api.get(`/products/colors${qs ? `?${qs}` : ''}`).then(r => r.data);
    }
  );

  const colorsFacetKey = useMemo(() => [...filters.colors].sort().join('|'), [filters.colors]);
  const { data: sizeData, isLoading: sizesLoading } = useQuery(
    ['productSizes', filters.category, colorsFacetKey, filters.filter],
    () => {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.filter) params.set('filter', filters.filter);
      if (filters.colors.length) params.set('colors', filters.colors.join(','));
      const qs = params.toString();
      return api.get(`/products/sizes${qs ? `?${qs}` : ''}`).then((r) => r.data);
    }
  );

  const categories      = catData?.categories   || [];
  const availableColors = colorData?.colors     || [];
  const priceFloor      = priceRangeData?.min   ?? 0;
  const priceCeil       = priceRangeData?.max   ?? 1000000;
  const priceStep       = Math.max(1000, Math.round((priceCeil - priceFloor) / 100 / 1000) * 1000);

  // Init slider when price bounds are loaded
  useEffect(() => {
    if (priceRangeData) setPriceInput({ min: priceRangeData.min, max: priceRangeData.max });
  }, [priceRangeData]);

  // Drop stale colors when category changes
  useEffect(() => {
    if (!availableColors.length) return;
    const valid = new Set(availableColors.map(c => c.color));
    const stale = filters.colors.filter(c => !valid.has(c));
    if (stale.length) setFilters(f => ({ ...f, colors: f.colors.filter(c => valid.has(c)) }));
  }, [availableColors]);

  const displaySizeRows = useMemo(() => {
    const apiSizes = sizeData?.sizes;
    if (apiSizes && apiSizes.length > 0) return sortSizeAgg(apiSizes);
    if (filters.colors.length > 0) {
      if (sizesLoading) return null;
      return [];
    }
    return sortSizeAgg(SIZES.map((size) => ({ size, count: null })));
  }, [sizeData?.sizes, colorsFacetKey, sizesLoading, filters.colors.length]);

  // Drop size chips that are not valid for current color / catalog facet list
  useEffect(() => {
    if (displaySizeRows == null) return;
    const valid = new Set(displaySizeRows.map((r) => r.size));
    const stale = filters.sizes.filter((s) => !valid.has(s));
    if (stale.length) setFilters((f) => ({ ...f, sizes: f.sizes.filter((s) => valid.has(s)) }));
  }, [displaySizeRows, filters.sizes]);

  useEffect(() => {
    if (!filterOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [filterOpen]);

  // ── Instant filter helpers ────────────────────────────
  const toggleSize = (size) =>
    setFilters(f => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter(s => s !== size) : [...f.sizes, size],
    }));

  const toggleColor = (color) =>
    setFilters(f => ({
      ...f,
      colors: f.colors.includes(color) ? f.colors.filter(c => c !== color) : [...f.colors, color],
    }));

  const handlePriceSlider = (key, rawValue) => {
    const val    = Number(rawValue);
    const newMin = key === 'min' ? Math.min(val, priceInput.max - priceStep) : priceInput.min;
    const newMax = key === 'max' ? Math.max(val, priceInput.min + priceStep) : priceInput.max;
    setPriceInput({ min: newMin, max: newMax });
    setFilters(f => ({
      ...f,
      minPrice: newMin <= priceFloor ? '' : newMin,
      maxPrice: newMax >= priceCeil  ? '' : newMax,
    }));
  };

  /** Clears only refinements (category / price / size / color). Keeps list view (?filter=sale) and search/sort. */
  const clearFilters = () => {
    setFilters((f) => ({
      ...f,
      category: '',
      minPrice: '',
      maxPrice: '',
      sizes: [],
      colors: [],
      sort: f.sort === 'categorySortOrder' ? '-createdAt' : f.sort,
      filter: saleMode ? 'sale' : featuredMode ? 'featured' : newArrivalMode ? 'new' : bestSellerMode ? 'bestSeller' : f.filter,
    }));
    setPriceInput({ min: priceFloor, max: priceCeil });
    if (!embed) {
      const next = { ...router.query };
      delete next.category;
      delete next.minPrice;
      delete next.maxPrice;
      if (saleMode) {
        delete next.filter;
        router.replace({ pathname: '/sale', query: next }, undefined, { shallow: true });
      } else if (featuredMode) {
        delete next.filter;
        router.replace({ pathname: '/featured', query: next }, undefined, { shallow: true });
      } else if (newArrivalMode) {
        delete next.filter;
        router.replace({ pathname: '/new-arrivals', query: next }, undefined, { shallow: true });
      } else if (bestSellerMode) {
        delete next.filter;
        router.replace({ pathname: '/best-sellers', query: next }, undefined, { shallow: true });
      } else {
        router.replace({ pathname: '/products', query: next }, undefined, { shallow: true });
      }
    }
  };

  /** Refinements only — not sale/new/featured (those are page context, not “filters”) */
  const sidebarFilterCount =
    (filters.category ? 1 : 0) +
    filters.sizes.length +
    filters.colors.length +
    (filters.minPrice || filters.maxPrice ? 1 : 0);

  const pageHeading = (() => {
    if (filters.search) return `"${filters.search}"`;
    if (filters.filter === 'sale')     return t.nav.sale;
    if (filters.filter === 'new')     return t.nav.newArrivals;
    if (filters.filter === 'featured') return t.home.featuredTitle;
    if (filters.filter === 'bestSeller') return t.nav.bestSellers;
    return s.allDresses;
  })();

  const eveningCat = categories.find((c) => c.slug === 'evening-dresses');
  const casualCat = categories.find((c) => c.slug === 'casual-dresses');
  const cocktailCat = categories.find((c) => c.slug === 'cocktail-dresses');

  const quickAllActive =
    !isCollectionPage &&
    !filters.filter &&
    !filters.category &&
    !filters.minPrice &&
    !filters.maxPrice &&
    filters.sizes.length === 0 &&
    filters.colors.length === 0;
  const under50Active =
    String(filters.maxPrice || '') === '50000' &&
    !filters.category &&
    (!filters.filter || ['sale', 'featured', 'new', 'bestSeller'].includes(filters.filter));

  const isHomeEmbed = embed && homeCompact;
  const stickyTopClass =
    'top-[calc(5.5rem+env(safe-area-inset-top,0px))] lg:top-[calc(7.75rem+env(safe-area-inset-top,0px))]';
  const pillBase =
    'flex-shrink-0 rounded-full text-[11px] font-body tracking-wide border transition-colors duration-200 touch-manipulation min-h-[40px] sm:min-h-0';
  const pillPad = isHomeEmbed ? 'px-4 py-1.5' : 'px-3.5 py-1.5';
  const pillOn = `${pillBase} ${pillPad} ${
    isHomeEmbed
      ? 'bg-[#a855c8] text-white border-[#a855c8] shadow-sm'
      : 'bg-brand-gold text-white border-brand-gold shadow-sm'
  }`;
  const pillOff = `${pillBase} ${pillPad} ${
    isHomeEmbed
      ? 'border-[#e8d0ee] bg-white text-[#a855c8] hover:bg-[#fdf0ff]'
      : 'border-brand-gold/45 text-brand-gold bg-transparent hover:bg-brand-purple-light/25 hover:border-brand-gold'
  }`;
  const pillSaleOn = `${pillBase} ${pillPad} ${
    isHomeEmbed
      ? 'bg-[#db2777] text-white border-[#db2777]'
      : 'bg-brand-gold text-white border-brand-gold shadow-sm'
  }`;
  const pillSaleOff = `${pillBase} ${pillPad} ${
    isHomeEmbed
      ? 'border-[#f9a8d4] text-[#db2777] bg-white hover:bg-pink-50'
      : 'border-brand-gold/45 text-brand-gold bg-transparent hover:bg-brand-purple-light/25 hover:border-brand-gold'
  }`;

  const resetListFilters = (extra = {}) => {
    setFilters((f) => ({
      ...f,
      filter: saleMode ? 'sale' : featuredMode ? 'featured' : newArrivalMode ? 'new' : bestSellerMode ? 'bestSeller' : '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sizes: [],
      colors: [],
      sort: f.sort === 'categorySortOrder' ? '-createdAt' : f.sort,
      ...extra,
    }));
    setPriceInput({ min: priceFloor, max: priceCeil });
  };

  // ── Filter Drawer (renders inline — no sub-component to prevent remount) ─
  const filterDrawerContent = (
    <div className="flex flex-col h-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="text-sm tracking-widest uppercase font-medium">{s.filters}</h2>
        <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none">×</button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Category */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between px-6 py-4 text-xs tracking-widest uppercase font-medium hover:text-brand-gold transition-colors"
          >
            {s.category} <ChevronIcon open={openSections.category} />
          </button>
          <AnimatePresence initial={false}>
            {openSections.category && (
              <motion.div
                key="cat"
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                transition={{ duration: 0.18 }} className="overflow-hidden"
              >
                <div className="px-6 pb-5 space-y-1">
                  <button
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        category: '',
                        sort: f.sort === 'categorySortOrder' ? '-createdAt' : f.sort,
                      }))
                    }
                    className={`block text-sm w-full py-1 transition-colors ${isRTL ? 'text-right' : 'text-left'} ${
                      !filters.category ? 'text-brand-gold font-medium' : 'text-gray-500 hover:text-brand-black'
                    }`}
                  >
                    {s.allDresses}
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat._id}
                      onClick={() => setFilters((f) => ({ ...f, category: cat._id, sort: 'categorySortOrder' }))}
                      className={`block text-sm w-full py-1 transition-colors ${isRTL ? 'text-right' : 'text-left'} ${
                        filters.category === cat._id ? 'text-brand-gold font-medium' : 'text-gray-500 hover:text-brand-black'
                      }`}
                    >
                      {catName(cat, isRTL)}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Price */}
        {priceRangeData && (
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection('price')}
              className="w-full flex items-center justify-between px-6 py-4 text-xs tracking-widest uppercase font-medium hover:text-brand-gold transition-colors"
            >
              {s.priceRange} <ChevronIcon open={openSections.price} />
            </button>
            <AnimatePresence initial={false}>
              {openSections.price && (
                <motion.div
                  key="price"
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  transition={{ duration: 0.18 }} className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    <div className={`flex justify-between text-xs text-gray-500 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span>{formatIQD(priceInput.min)}</span>
                      <span>{formatIQD(priceInput.max)}</span>
                    </div>
                    <div className="relative h-5 mx-1" dir="ltr">
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full w-full"
                        style={{
                          background: `linear-gradient(to right,
                            #e8d5ff ${((priceInput.min - priceFloor) / (priceCeil - priceFloor)) * 100}%,
                            var(--gold) ${((priceInput.min - priceFloor) / (priceCeil - priceFloor)) * 100}%,
                            var(--gold) ${((priceInput.max - priceFloor) / (priceCeil - priceFloor)) * 100}%,
                            #e8d5ff ${((priceInput.max - priceFloor) / (priceCeil - priceFloor)) * 100}%)`
                        }}
                      />
                      <input type="range" min={priceFloor} max={priceCeil} step={priceStep}
                        value={priceInput.min} onChange={e => handlePriceSlider('min', e.target.value)}
                        className="price-thumb" />
                      <input type="range" min={priceFloor} max={priceCeil} step={priceStep}
                        value={priceInput.max} onChange={e => handlePriceSlider('max', e.target.value)}
                        className="price-thumb" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Colour */}
        {availableColors.length > 0 && (
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection('colour')}
              className="w-full flex items-center justify-between px-6 py-4 text-xs tracking-widest uppercase font-medium hover:text-brand-gold transition-colors"
            >
              {s.color} <ChevronIcon open={openSections.colour} />
            </button>
            <AnimatePresence initial={false}>
              {openSections.colour && (
                <motion.div
                  key="colour"
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  transition={{ duration: 0.18 }} className="overflow-hidden"
                >
                  <div className="px-6 pb-5 space-y-1">
                    {availableColors.map(({ color, colorCode, count }) => {
                      const active = filters.colors.includes(color);
                      return (
                        <button
                          key={color}
                          onClick={() => toggleColor(color)}
                          className={`flex items-center gap-3 w-full py-1 text-sm transition-colors ${
                            active ? 'text-brand-gold font-medium' : 'text-gray-600 hover:text-brand-black'
                          } ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border ${active ? 'border-brand-gold' : 'border-gray-200'}`}
                            style={{ backgroundColor: colorCode || '#ccc' }}
                          />
                          <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{color}</span>
                          {count != null && <span className="text-gray-400 text-xs">({count})</span>}
                          {active && <span className="text-brand-gold text-xs ml-1">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Size */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleSection('size')}
            className="w-full flex items-center justify-between px-6 py-4 text-xs tracking-widest uppercase font-medium hover:text-brand-gold transition-colors"
          >
            {s.size} <ChevronIcon open={openSections.size} />
          </button>
          <AnimatePresence initial={false}>
            {openSections.size && (
              <motion.div
                key="size"
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                transition={{ duration: 0.18 }} className="overflow-hidden"
              >
                <div className="px-6 pb-5">
                  {displaySizeRows == null ? (
                    <p className="text-xs text-gray-500 py-1">{s.sizesLoading}</p>
                  ) : displaySizeRows.length === 0 ? (
                    <p className="text-xs text-gray-500 py-1 leading-relaxed">{s.sizesNoneForColors}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {displaySizeRows.map(({ size, count }) => {
                        const active = filters.sizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs border transition-all duration-150 ${
                              active
                                ? 'bg-brand-black text-white border-brand-black'
                                : 'border-gray-200 text-gray-600 hover:border-brand-black hover:text-brand-black'
                            }`}
                          >
                            {size}
                            {count != null && (
                              <span className={active ? 'text-white/70' : 'text-gray-400'}>({count})</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-gray-100">
        <button
          onClick={clearFilters}
          className="w-full py-3 text-xs tracking-widest uppercase font-medium border border-gray-300 text-gray-600 hover:border-brand-gold hover:text-brand-gold transition-all duration-200"
        >
          {s.clearAllFilters}
        </button>
      </div>
    </div>
  );

  const h = t.home;

  return (
    <>
      {!embed && !skipPageSeo && (
        <NextSeo
          title={pageHeading}
          description={
            saleMode
              ? s.salePageDescription
              : featuredMode
                ? s.featuredPageDescription
                : newArrivalMode
                  ? s.newArrivalsPageDescription
                  : bestSellerMode
                    ? s.bestSellersPageDescription
                    : "Browse our complete collection of luxury women's dresses."
          }
        />
      )}

      <div dir={isRTL ? 'rtl' : 'ltr'}>
        {/* ── Page / section title (skipped on home embed — hero already sets context) ─ */}
        {!embed ? (
          <div className="text-center py-10 border-b border-gray-100">
            <h1 className="font-display text-4xl md:text-5xl font-light text-brand-black">
              {pageHeading}
            </h1>
          </div>
        ) : !homeCompact ? (
          <div className="text-center py-8 md:py-10 border-b border-[#e8d0ee]/50 bg-brand-cream">
            <p className="section-subtitle mb-2">{h.shopAllSubtitle}</p>
            <h2 className="font-display text-3xl md:text-4xl font-light text-brand-black">
              {pageHeading}
            </h2>
          </div>
        ) : null}

        {/* ── Toolbar (sticky below global header / announcement) ─ */}
        <div
          className={`border-b z-40 shadow-[0_1px_0_rgba(0,0,0,0.04)] ${
            isHomeEmbed
              ? 'relative border-[#e8d0ee]/80 bg-brand-cream'
              : `sticky ${stickyTopClass} border-gray-200/90 bg-white/95 backdrop-blur-md`
          }`}
        >
          <div className="container-luxury flex items-center justify-between min-h-[48px] h-auto py-1.5 gap-2 sm:gap-4">

            {/* Left: Filters + Clear — same drawer as /products; home uses purple accent styling */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className={`flex items-center gap-2 min-h-[44px] px-1 -ms-1 rounded-md text-xs tracking-widest uppercase transition-colors flex-shrink-0 touch-manipulation active:bg-black/[0.04] ${
                  isHomeEmbed
                    ? 'text-[#6b6b8a] hover:text-[#a855c8]'
                    : 'text-gray-600 hover:text-brand-gold'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
                </svg>
                {isRTL ? 'التصفية' : 'Filters'}
                {sidebarFilterCount > 0 && (
                  <span
                    className={`w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center ${
                      isHomeEmbed ? 'bg-[#a855c8]' : 'bg-brand-gold'
                    }`}
                  >
                    {sidebarFilterCount}
                  </span>
                )}
              </button>

              {sidebarFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`flex items-center gap-1 min-h-[44px] px-1 rounded-md text-xs transition-colors flex-shrink-0 touch-manipulation active:bg-black/[0.04] ${
                    isHomeEmbed
                      ? 'text-[#9ca3af] hover:text-[#a855c8]'
                      : 'text-gray-400 hover:text-brand-gold'
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {isRTL ? 'مسح' : 'Clear'}
                </button>
              )}
            </div>

            {/* Right: Sort */}
            <div className="flex items-center gap-2 flex-shrink-0 ms-auto">
              <span className="text-xs text-gray-400 hidden sm:inline">
                {isRTL ? 'ترتيب:' : 'Sort by:'}
              </span>
              <select
                value={filters.sort}
                onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                className={
                  isHomeEmbed
                    ? 'text-xs text-[#1a1a2e] bg-brand-cream border border-[#e8d0ee] rounded-lg px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 cursor-pointer outline-none font-body hover:border-[#a855c8]/50 touch-manipulation max-w-[min(100%,11rem)] sm:max-w-none'
                    : 'text-xs text-gray-700 bg-transparent border-none outline-none cursor-pointer hover:text-brand-gold transition-colors min-h-[44px] sm:min-h-0 py-2 sm:py-0 touch-manipulation max-w-[min(100%,11rem)] sm:max-w-none'
                }
              >
                {(filters.category
                  ? [{ value: 'categorySortOrder', label: s.sortCategoryOrder }, ...SORT_OPTIONS]
                  : SORT_OPTIONS
                ).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick filter pills — /products only (home uses drawer + sort) */}
          {!isHomeEmbed && (
            <div className="container-luxury pb-3 pt-1 flex gap-2 overflow-x-auto overflow-y-hidden scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  if (saleMode || featuredMode || newArrivalMode || bestSellerMode) {
                    setFilters({
                      category: '',
                      minPrice: '',
                      maxPrice: '',
                      sizes: [],
                      colors: [],
                      sort: '-createdAt',
                      search: '',
                      filter: '',
                    });
                    setPriceInput({ min: priceFloor, max: priceCeil });
                    const next = { ...router.query };
                    delete next.filter;
                    delete next.category;
                    delete next.minPrice;
                    delete next.maxPrice;
                    router.replace({ pathname: '/products', query: next }, undefined, { shallow: true });
                    return;
                  }
                  resetListFilters();
                  const next = { ...router.query };
                  delete next.filter;
                  delete next.category;
                  delete next.minPrice;
                  delete next.maxPrice;
                  router.replace({ pathname: '/products', query: next }, undefined, { shallow: true });
                }}
                className={quickAllActive ? pillOn : pillOff}
              >
                {s.filterTabAll}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newArrivalMode) return;
                  resetListFilters({ filter: 'new' });
                  const next = { ...router.query };
                  delete next.filter;
                  router.replace({ pathname: '/new-arrivals', query: next }, undefined, { shallow: true });
                }}
                className={filters.filter === 'new' && !filters.category ? pillOn : pillOff}
              >
                {t.nav.newArrivals}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (saleMode) return;
                  resetListFilters({ filter: 'sale' });
                  const next = { ...router.query };
                  delete next.filter;
                  router.replace({ pathname: '/sale', query: next }, undefined, { shallow: true });
                }}
                className={filters.filter === 'sale' && !filters.category ? pillSaleOn : pillSaleOff}
              >
                {t.nav.sale}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (featuredMode) return;
                  resetListFilters({ filter: 'featured' });
                  const next = { ...router.query };
                  delete next.filter;
                  router.replace({ pathname: '/featured', query: next }, undefined, { shallow: true });
                }}
                className={filters.filter === 'featured' && !filters.category ? pillOn : pillOff}
              >
                {t.nav.featured}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (bestSellerMode) return;
                  resetListFilters({ filter: 'bestSeller' });
                  const next = { ...router.query };
                  delete next.filter;
                  router.replace({ pathname: '/best-sellers', query: next }, undefined, { shallow: true });
                }}
                className={filters.filter === 'bestSeller' && !filters.category ? pillOn : pillOff}
              >
                {t.nav.bestSellers}
              </button>
              {eveningCat && (
                <button
                  type="button"
                  onClick={() => {
                    resetListFilters({ category: eveningCat._id });
                    router.replace({ pathname: listPathname, query: { ...router.query, category: eveningCat.slug } }, undefined, { shallow: true });
                  }}
                  className={
                    filters.category === eveningCat._id &&
                    (!filters.filter || ['sale', 'featured', 'new', 'bestSeller'].includes(filters.filter))
                      ? pillOn
                      : pillOff
                  }
                >
                  {t.nav.evening}
                </button>
              )}
              {casualCat && (
                <button
                  type="button"
                  onClick={() => {
                    resetListFilters({ category: casualCat._id });
                    router.replace({ pathname: listPathname, query: { ...router.query, category: casualCat.slug } }, undefined, { shallow: true });
                  }}
                  className={
                    filters.category === casualCat._id &&
                    (!filters.filter || ['sale', 'featured', 'new', 'bestSeller'].includes(filters.filter))
                      ? pillOn
                      : pillOff
                  }
                >
                  {t.nav.casual}
                </button>
              )}
              {cocktailCat && (
                <button
                  type="button"
                  onClick={() => {
                    resetListFilters({ category: cocktailCat._id });
                    router.replace({ pathname: listPathname, query: { ...router.query, category: cocktailCat.slug } }, undefined, { shallow: true });
                  }}
                  className={
                    filters.category === cocktailCat._id &&
                    (!filters.filter || ['sale', 'featured', 'new', 'bestSeller'].includes(filters.filter))
                      ? pillOn
                      : pillOff
                  }
                >
                  {t.nav.cocktail}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  resetListFilters({ maxPrice: '50000' });
                  router.replace({ pathname: listPathname, query: { ...router.query, maxPrice: '50000' } }, undefined, { shallow: true });
                }}
                className={under50Active ? pillOn : pillOff}
              >
                {s.filterUnder50k}
              </button>
            </div>
          )}
        </div>

        {isHomeEmbed && !isLoading && total > 0 && (
          <div className="container-luxury pt-2 pb-3 bg-brand-cream border-b border-[#e8d0ee]/50">
            <p className="text-xs text-[#6b6b8a] font-body">
              {s.showingOfTotal.replace('{shown}', String(products.length)).replace('{total}', String(total))}
            </p>
          </div>
        )}

        {/* ── Active refinement chips (not sale/new/featured — those are the page title) ─ */}
        {sidebarFilterCount > 0 && (
          <div className="container-luxury py-3 flex flex-wrap gap-2">
            {filters.category && categories.find(c => c._id === filters.category) && (
              <button
                onClick={() => {
                  setFilters((f) => ({
                    ...f,
                    category: '',
                    sort: f.sort === 'categorySortOrder' ? '-createdAt' : f.sort,
                  }));
                  if (!embed) {
                    const next = { ...router.query };
                    delete next.category;
                    router.replace({ pathname: listPathname, query: next }, undefined, { shallow: true });
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1 text-xs border border-brand-gold/40 text-brand-gold bg-brand-purple-light/30 hover:bg-brand-purple-light/60 transition-colors"
              >
                {catName(categories.find(c => c._id === filters.category), isRTL)}
                <span className="text-brand-gold/60">×</span>
              </button>
            )}
            {filters.sizes.map(size => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs border border-brand-gold/40 text-brand-gold bg-brand-purple-light/30 hover:bg-brand-purple-light/60 transition-colors"
              >
                {size} <span className="text-brand-gold/60">×</span>
              </button>
            ))}
            {filters.colors.map(color => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs border border-brand-gold/40 text-brand-gold bg-brand-purple-light/30 hover:bg-brand-purple-light/60 transition-colors"
              >
                {color} <span className="text-brand-gold/60">×</span>
              </button>
            ))}
            {(filters.minPrice || filters.maxPrice) && (
              <button
                onClick={() => { setFilters(f => ({ ...f, minPrice: '', maxPrice: '' })); setPriceInput({ min: priceFloor, max: priceCeil }); }}
                className="flex items-center gap-1.5 px-3 py-1 text-xs border border-brand-gold/40 text-brand-gold bg-brand-purple-light/30 hover:bg-brand-purple-light/60 transition-colors"
              >
                {formatIQD(priceInput.min)} – {formatIQD(priceInput.max)}
                <span className="text-brand-gold/60">×</span>
              </button>
            )}
          </div>
        )}

        {/* ── Product grid ───────────────────────── */}
        <div className={`container-luxury ${homeCompact && embed ? 'py-5 md:py-6' : 'py-8'}`}>
          {isLoading ? (
            <div
              className={
                homeCompact && embed
                  ? 'grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4'
                  : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-5'
              }
            >
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-28">
              <p className="font-display text-3xl mb-4 text-gray-400">{s.noPiecesFound}</p>
              <p className="text-sm text-gray-400 mb-8">{s.tryAdjusting}</p>
              <button onClick={clearFilters} className="btn-primary">{s.clearFilters}</button>
            </div>
          ) : (
            <>
              <div
                className={
                  homeCompact && embed
                    ? 'grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4'
                    : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-5'
                }
              >
                {products.map((p, i) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    index={i}
                    imageSizes={homeCompact && embed ? '(max-width: 768px) 50vw, 25vw' : undefined}
                  />
                ))}
              </div>

              {hasNextPage && (
                <div
                  className={
                    isHomeEmbed
                      ? 'flex flex-col items-center gap-2.5 mt-10 md:mt-12'
                      : 'flex justify-center mt-12 md:mt-16'
                  }
                >
                  {isHomeEmbed && (
                    <>
                      <div className="w-[200px] h-0.5 bg-[#e8d0ee] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#a855c8] rounded-full transition-all duration-300"
                          style={{
                            width: `${total > 0 ? Math.min(100, Math.round((products.length / total) * 100)) : 0}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-[#6b6b8a] font-body">
                        {s.showingOfTotal.replace('{shown}', String(products.length)).replace('{total}', String(total))}
                      </p>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className={
                      isHomeEmbed
                        ? 'px-8 py-2.5 text-[13px] font-medium font-body rounded-[10px] border-[1.5px] border-[#a855c8] text-[#a855c8] bg-brand-cream hover:bg-[#a855c8] hover:text-white transition-colors disabled:opacity-45 disabled:cursor-not-allowed min-w-[200px]'
                        : 'px-8 py-3.5 text-[11px] tracking-[0.2em] uppercase font-body font-medium rounded-lg border-2 border-brand-gold text-brand-gold bg-transparent hover:bg-brand-purple-light/25 transition-colors disabled:opacity-45 disabled:cursor-not-allowed min-w-[240px]'
                    }
                  >
                    {isFetchingNextPage
                      ? s.loadMoreLoading
                      : s.loadMore
                          .replace('{n}', String(PAGE_SIZE))
                          .replace('{remaining}', String(Math.max(0, total - products.length)))}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Filter Drawer ──────────────────────── */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFilterOpen(false)}
              className="fixed inset-0 bg-black/30 z-[130] touch-manipulation"
            />
            <motion.div
              initial={{ x: isRTL ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '100%' : '-100%' }}
              transition={{ type: 'tween', duration: 0.26 }}
              className={`fixed ${isRTL ? 'right-0' : 'left-0'} top-0 h-[100dvh] max-h-[100dvh] w-[min(100%,300px)] max-w-[min(90vw,300px)] bg-white z-[140] flex flex-col shadow-2xl pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]`}
            >
              {filterDrawerContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
