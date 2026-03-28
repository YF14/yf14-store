import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminProductForm from '../../components/admin/AdminProductForm';
import useAuthStore from '../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../lib/adminAccess';
import { useLang } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { catName, formatIQD } from '../../lib/currency';

const BG = '#0f1117';
const CARD = '#1a1d2e';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT = '#e8e8f0';
const MUTED = '#9ca3af';
const MUTED2 = '#6b7280';

export default function AdminNewArrivalProductsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const { t, isRTL } = useLang();
  const a = t.admin;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [productFormMode, setProductFormMode] = useState(null);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'newArrivals')) router.replace(getDefaultAdminPath(user));
  }, [user, isAuthReady, router]);

  const naOk = !!user && canAccessAdmin(user) && hasAdminPermission(user, 'newArrivals');

  const { data: catData } = useQuery(
    ['admin-categories-all'],
    () => api.get('/categories/admin/all').then((r) => r.data),
    { enabled: naOk }
  );
  const allCategories = catData?.categories || [];

  const {
    data: prodData,
    isLoading,
    refetch,
  } = useQuery(
    ['admin-new-arrival-products'],
    () =>
      api.get('/products?filter=new&showAll=1&limit=500&sort=newArrivalSortOrder').then((r) => r.data),
    { enabled: naOk }
  );

  const products = prodData?.products || [];

  useEffect(() => {
    if (!products.length) {
      setItems([]);
      return;
    }
    setItems((prev) => {
      if (prev.length === 0) return [...products];
      const byId = Object.fromEntries(products.map((p) => [String(p._id), p]));
      const merged = prev.map((p) => byId[String(p._id)]).filter(Boolean);
      const prevIdSet = new Set(prev.map((p) => String(p._id)));
      const appended = products.filter((p) => !prevIdSet.has(String(p._id)));
      return appended.length ? [...merged, ...appended] : merged;
    });
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        catName(p.category, isRTL)?.toLowerCase().includes(q)
    );
  }, [items, search, isRTL]);

  const move = (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    setItems((arr) => {
      const next = [...arr];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const saveOrderMutation = useMutation(
    () =>
      api.put('/products/reorder-new-arrivals', {
        orderedProductIds: items.map((p) => p._id),
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-new-arrival-products']);
        queryClient.invalidateQueries(['products']);
        toast.success(a.newArrivalOrderSaved);
      },
      onError: (err) => toast.error(err.response?.data?.error || a.failedUpdate),
    }
  );

  const patchProductMutation = useMutation(
    ({ productId, body }) => api.put(`/products/${productId}`, body),
    {
      onSuccess: () => {
        refetch();
        queryClient.invalidateQueries(['products']);
        toast.success(a.productUpdated);
      },
      onError: () => toast.error(a.failedUpdate),
    }
  );

  const moveCategoryMutation = useMutation(
    ({ productId, newCategoryId }) => api.put(`/products/${productId}`, { category: newCategoryId }),
    {
      onSuccess: () => {
        refetch();
        queryClient.invalidateQueries(['products']);
        toast.success(a.movedToCategory);
      },
      onError: (err) => toast.error(err.response?.data?.error || a.failedUpdate),
    }
  );

  if (!user || !canAccessAdmin(user) || !hasAdminPermission(user, 'newArrivals')) return null;

  const totalStock = (p) => p.variants?.reduce((s, v) => s + (v.stock || 0), 0) ?? 0;
  const priceDiscount = (p) =>
    p.comparePrice && p.comparePrice > p.price
      ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
      : 0;

  return (
    <AdminLayout>
      <NextSeo title={`${a.newArrivalsPageTitle} — Admin`} />
      <div
        className="-mx-8 -mt-8 -mb-8 px-6 sm:px-8 pt-8 pb-16 min-h-screen"
        style={{ backgroundColor: BG, color: TEXT }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <Link
              href="/admin/categories"
              className="text-sm mb-3 inline-block transition-opacity hover:opacity-80"
              style={{ color: MUTED }}
            >
              ← {a.backToCategories}
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex flex-wrap items-center gap-2">
                  <span>{a.newArrivalsPageTitle}</span>
                  <span className="text-lg font-normal font-mono" style={{ color: MUTED2 }}>
                    /new-arrivals
                  </span>
                </h1>
                <p className="text-sm mt-1" style={{ color: MUTED }}>
                  {a.newArrivalsPageSubtitle.replace('{n}', String(items.length))}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => saveOrderMutation.mutate()}
                  disabled={saveOrderMutation.isLoading || items.length === 0}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#0ea5e9,#0369a1)' }}
                >
                  {a.saveOrder}
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProductFormMode('new')}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-white/5"
                    style={{ borderColor: 'rgba(255,255,255,0.25)', color: TEXT }}
                  >
                    {a.addProductHere}
                  </button>
                  <Link
                    href="/admin/products/new"
                    className="text-xs underline-offset-2 hover:underline px-1"
                    style={{ color: MUTED2 }}
                  >
                    {a.catFullPageEditor}
                  </Link>
                </div>
                <a
                  href="/new-arrivals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-white/5 inline-flex items-center justify-center"
                  style={{ borderColor: 'rgba(255,255,255,0.25)', color: TEXT }}
                >
                  {a.newArrivalsPreviewShop} ↗
                </a>
              </div>
            </div>
          </div>

          <p className="text-xs mb-4" style={{ color: MUTED2 }}>
            {a.newArrivalsReorderHint}
          </p>

          {productFormMode && (
            <div
              className="rounded-2xl border overflow-hidden mb-8 p-5 sm:p-6"
              style={{ backgroundColor: '#faf9f7', borderColor: BORDER, color: '#1a1a1a' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <h2 className="text-lg font-semibold text-brand-black">
                  {productFormMode === 'new' ? a.addNewProduct : a.editProduct}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {productFormMode !== 'new' && (
                    <Link
                      href={`/admin/products/${productFormMode}/edit`}
                      className="text-xs px-3 py-1.5 rounded-lg border border-brand-black/15 text-brand-warm-gray hover:border-brand-gold hover:text-brand-gold"
                    >
                      {a.catFullPageEditor} ↗
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setProductFormMode(null)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-brand-black/15 text-brand-warm-gray hover:bg-black/[0.04]"
                  >
                    {a.closePanel}
                  </button>
                </div>
              </div>
              <AdminProductForm
                key={productFormMode === 'new' ? 'new-arrivals-admin' : productFormMode}
                productId={productFormMode === 'new' ? null : productFormMode}
                onSuccess={() => {
                  setProductFormMode(null);
                  refetch();
                  queryClient.invalidateQueries(['products']);
                  queryClient.invalidateQueries({ queryKey: ['admin-product'] });
                  queryClient.invalidateQueries(['admin-new-arrival-product-count']);
                }}
                onCancel={() => setProductFormMode(null)}
              />
            </div>
          )}

          <div className="mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={a.searchInCategory}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border"
              style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }}
            />
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: CARD, borderColor: BORDER }}>
            {isLoading ? (
              <div className="py-16 text-center text-sm" style={{ color: MUTED }}>
                …
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-sm px-4" style={{ color: MUTED }}>
                {items.length === 0 ? a.newArrivalsNoProducts : a.noSearchResults}
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: BORDER }}>
                {filtered.map((p) => {
                  const idx = items.findIndex((x) => x._id === p._id);
                  const disc = priceDiscount(p);
                  return (
                    <li
                      key={p._id}
                      className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            aria-label={a.moveUp}
                            disabled={idx <= 0}
                            onClick={() => move(idx, -1)}
                            className="w-9 h-8 rounded-lg border text-xs disabled:opacity-30 hover:bg-white/5"
                            style={{ borderColor: BORDER, color: MUTED }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label={a.moveDown}
                            disabled={idx >= items.length - 1}
                            onClick={() => move(idx, 1)}
                            className="w-9 h-8 rounded-lg border text-xs disabled:opacity-30 hover:bg-white/5"
                            style={{ borderColor: BORDER, color: MUTED }}
                          >
                            ↓
                          </button>
                        </div>
                        <div className="w-14 h-[4.5rem] relative rounded-lg overflow-hidden shrink-0 bg-black/30">
                          {p.images?.[0]?.url ? (
                            <Image src={p.images[0].url} alt="" fill className="object-cover" sizes="56px" />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-lg opacity-40">
                              —
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{p.name}</p>
                          <p className="text-xs font-mono truncate" style={{ color: MUTED2 }}>
                            {p.slug}
                          </p>
                          <p className="text-[11px] truncate mt-0.5" style={{ color: MUTED }}>
                            {a.salesColumnCategory}: {p.category ? catName(p.category, isRTL) : '—'}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {!p.isActive && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300">
                                {a.inactive}
                              </span>
                            )}
                            {disc > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300">
                                −{disc}%
                              </span>
                            )}
                            {p.isFeatured && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300">
                                {a.featured}
                              </span>
                            )}
                            {p.isNewArrival && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300">
                                {a.newArrival}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <span className="text-sm font-medium tabular-nums" style={{ color: TEXT }}>
                          {formatIQD(p.price)}
                        </span>
                        {p.comparePrice > p.price && (
                          <span className="text-xs line-through tabular-nums" style={{ color: MUTED2 }}>
                            {formatIQD(p.comparePrice)}
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 rounded-lg bg-white/5" style={{ color: MUTED }}>
                          {a.stock}: {totalStock(p)}
                        </span>
                        <select
                          value=""
                          onChange={(e) => {
                            const v = e.target.value;
                            e.target.value = '';
                            if (!v) return;
                            if (!confirm(a.moveCategoryConfirm)) return;
                            moveCategoryMutation.mutate({ productId: p._id, newCategoryId: v });
                          }}
                          className="text-xs px-2 py-2 rounded-lg border max-w-[140px] cursor-pointer bg-transparent"
                          style={{ borderColor: BORDER, color: MUTED }}
                        >
                          <option value="">{a.changeCategory}</option>
                          {allCategories.map((c) => (
                            <option key={c._id} value={c._id}>
                              {catName(c, isRTL)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            patchProductMutation.mutate({
                              productId: p._id,
                              body: { isFeatured: !p.isFeatured },
                            })
                          }
                          className="text-xs px-3 py-2 rounded-lg border hover:bg-white/5"
                          style={{ borderColor: BORDER, color: MUTED }}
                        >
                          {p.isFeatured ? a.unfeature : a.featureToggle}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            patchProductMutation.mutate({
                              productId: p._id,
                              body: { isNewArrival: !p.isNewArrival },
                            })
                          }
                          className="text-xs px-3 py-2 rounded-lg border hover:bg-white/5"
                          style={{ borderColor: BORDER, color: MUTED }}
                        >
                          {p.isNewArrival ? a.unmarkNew : a.markNew}
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductFormMode(String(p._id))}
                          className="text-xs px-3 py-2 rounded-lg border hover:bg-white/5"
                          style={{ borderColor: BORDER, color: MUTED }}
                        >
                          {a.edit}
                        </button>
                        <Link
                          href={`/admin/products/${p._id}/edit`}
                          className="text-xs px-2 py-2 rounded-lg opacity-70 hover:opacity-100"
                          style={{ color: MUTED2 }}
                          title={a.catFullPageEditor}
                        >
                          ↗
                        </Link>
                        <a
                          href={`/products/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-2 rounded-lg border hover:bg-white/5"
                          style={{ borderColor: BORDER, color: MUTED }}
                        >
                          {a.viewStore} ↗
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
