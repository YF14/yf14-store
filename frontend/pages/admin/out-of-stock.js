import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../lib/adminAccess';
import api from '../../lib/api';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

const BG = '#0f1117';
const CARD = '#1a1d2e';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT = '#e8e8f0';
const MUTED = '#9ca3af';
const MUTED2 = '#6b7280';

export default function OutOfStockPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const queryClient = useQueryClient();
  const { t, isRTL } = useLang();

  const [search, setSearch] = useState('');
  // productId -> hiddenCategoryId being acted on (to show per-row loading)
  const [busy, setBusy] = useState({});

  const canView = !!user && canAccessAdmin(user) && hasAdminPermission(user, 'stock');

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'stock')) router.replace(getDefaultAdminPath(user));
  }, [user, isAuthReady, router]);

  // All products that are OOS (includes hiddenCategoryIds per product)
  const { data: oosData, isLoading: oosLoading } = useQuery(
    ['admin-out-of-stock'],
    () => api.get('/products/admin/out-of-stock').then((r) => r.data),
    { enabled: canView, staleTime: 30 * 1000 }
  );

  // All categories — we only care about the hidden ones
  const { data: catData } = useQuery(
    ['admin-categories-all'],
    () => api.get('/categories/admin/all').then((r) => r.data),
    { enabled: canView }
  );

  const products = oosData?.products || [];
  const total = oosData?.total || 0;
  const hiddenCategories = useMemo(
    () => (catData?.categories || []).filter((c) => c.isHidden),
    [catData]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.slug?.includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
    );
  }, [products, search]);

  // Add a single product to a hidden category
  const addMutation = useMutation(
    ({ categoryId, productId }) =>
      api.post(`/categories/hidden/${categoryId}/products`, { productIds: [productId] }),
    {
      onMutate: ({ productId, categoryId }) => setBusy((b) => ({ ...b, [productId]: categoryId })),
      onSettled: (_, __, { productId }) => setBusy((b) => { const n = { ...b }; delete n[productId]; return n; }),
      onSuccess: (_, { categoryId }) => {
        queryClient.invalidateQueries(['admin-out-of-stock']);
        queryClient.invalidateQueries(['private-cat-products', categoryId]);
        const cat = hiddenCategories.find((c) => String(c._id) === String(categoryId));
        toast.success(`Added to "${cat?.name || 'private category'}"`);
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Failed to add'),
    }
  );

  // Remove a product from a hidden category
  const removeMutation = useMutation(
    ({ categoryId, productId }) =>
      api.delete(`/categories/hidden/${categoryId}/products/${productId}`),
    {
      onMutate: ({ productId, categoryId }) => setBusy((b) => ({ ...b, [productId]: categoryId })),
      onSettled: (_, __, { productId }) => setBusy((b) => { const n = { ...b }; delete n[productId]; return n; }),
      onSuccess: (_, { categoryId }) => {
        queryClient.invalidateQueries(['admin-out-of-stock']);
        queryClient.invalidateQueries(['private-cat-products', categoryId]);
        const cat = hiddenCategories.find((c) => String(c._id) === String(categoryId));
        toast.success(`Removed from "${cat?.name || 'private category'}"`);
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Failed to remove'),
    }
  );

  if (!canView) return null;

  return (
    <AdminLayout>
      <NextSeo title="Out of Stock — Admin" />
      <div
        className="-mx-8 -mt-8 -mb-8 px-6 sm:px-8 pt-8 pb-16 min-h-screen"
        style={{ backgroundColor: BG, color: TEXT }}
      >
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-red-500/15 text-red-300 border border-red-500/25 uppercase tracking-wider">
                  {t.admin.outOfStockMenu || 'Out of Stock'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: TEXT }}>
                {t.admin.outOfStockMenu || 'Out of Stock'}
              </h1>
              <p className="text-sm mt-1" style={{ color: MUTED }}>
                {isRTL
                  ? 'المنتجات التي نفد مخزونها — يمكن إضافتها إلى فئة خاصة لمنحها مخزوناً غير محدود'
                  : 'Products with zero stock — send them to a private category to give them unlimited stock'}
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div
            className="rounded-xl border px-4 py-3 mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
            style={{ backgroundColor: CARD, borderColor: BORDER }}
          >
            <span style={{ color: MUTED }}>
              {isRTL ? 'نفد مخزونها:' : 'Out of stock:'}{' '}
              <strong style={{ color: TEXT }}>{total}</strong>
            </span>
            {hiddenCategories.length > 0 && (
              <>
                <span className="h-4 w-px hidden sm:block" style={{ backgroundColor: BORDER }} />
                <span style={{ color: MUTED }}>
                  {isRTL ? 'الفئات الخاصة:' : 'Private categories:'}{' '}
                  {hiddenCategories.map((c) => (
                    <Link
                      key={c._id}
                      href={`/admin/categories/private?id=${c._id}`}
                      className="inline-block mx-1 text-xs px-2 py-0.5 rounded border hover:bg-white/5 transition-colors"
                      style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}
                    >
                      {c.name}
                    </Link>
                  ))}
                </span>
              </>
            )}
            {hiddenCategories.length === 0 && (
              <>
                <span className="h-4 w-px hidden sm:block" style={{ backgroundColor: BORDER }} />
                <span className="text-xs" style={{ color: MUTED2 }}>
                  {isRTL
                    ? 'لا توجد فئات خاصة بعد — '
                    : 'No private categories yet — '}
                  <Link href="/admin/categories" className="underline hover:text-white transition-colors">
                    {isRTL ? 'أنشئ واحدة' : 'create one'}
                  </Link>
                </span>
              </>
            )}
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRTL ? 'بحث في المنتجات…' : 'Search products…'}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors focus:border-red-500/40"
              style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }}
            />
          </div>

          {/* Product table */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: CARD, borderColor: BORDER }}>
            {/* Column headers */}
            <div
              className="flex items-center gap-3 py-2 px-4 border-b text-[10px] uppercase tracking-wider font-semibold"
              style={{ borderColor: BORDER, color: MUTED2 }}
            >
              <span className="flex-1">{isRTL ? 'المنتج' : 'Product'}</span>
              <span className="w-24 shrink-0 text-center hidden sm:block">{isRTL ? 'الفئة' : 'Category'}</span>
              <span className="w-16 shrink-0 text-center hidden sm:block">{isRTL ? 'المتغيرات' : 'Variants'}</span>
              {hiddenCategories.length > 0 && (
                <span className="w-36 shrink-0 text-center">{isRTL ? 'الفئة الخاصة' : 'Private cat.'}</span>
              )}
              <span className="w-16 shrink-0 text-end">{isRTL ? 'تعديل' : 'Edit'}</span>
            </div>

            {oosLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b animate-pulse" style={{ borderColor: BORDER }}>
                  <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-4 rounded flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center" style={{ color: MUTED }}>
                {products.length === 0 ? (
                  <div>
                    <p className="text-4xl mb-3">✅</p>
                    <p className="text-sm font-medium">
                      {isRTL ? 'لا توجد منتجات نفد مخزونها!' : 'No products are out of stock!'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: MUTED2 }}>
                      {isRTL ? 'جميع المنتجات متوفرة حالياً.' : 'All products currently have stock available.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm">{isRTL ? 'لا توجد نتائج مطابقة.' : 'No products match your search.'}</p>
                )}
              </div>
            ) : (
              filtered.map((p) => {
                const thumb = p.images?.[0]?.url;
                const variantCount = (p.variants || []).length;
                const isBusy = !!busy[p._id];

                // Which hidden categories this product already belongs to
                const assignedIds = new Set(p.hiddenCategoryIds || []);

                return (
                  <div
                    key={p._id}
                    className="flex items-center gap-3 px-4 py-3 border-b transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: BORDER }}
                  >
                    {/* Thumbnail + name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {thumb ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                          <Image src={thumb} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-lg"
                          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                        >
                          👗
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: TEXT }}>{p.name}</p>
                        <p className="text-xs font-mono truncate" style={{ color: MUTED2 }}>{p.slug}</p>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="w-24 shrink-0 text-center hidden sm:block">
                      <span
                        className="text-xs px-2 py-0.5 rounded truncate inline-block max-w-full"
                        style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: MUTED }}
                      >
                        {p.category?.name || '—'}
                      </span>
                    </div>

                    {/* Variant count */}
                    <div className="w-16 shrink-0 text-center hidden sm:block">
                      <span className="text-xs font-semibold text-red-400">
                        {variantCount === 0 ? '—' : variantCount}
                      </span>
                    </div>

                    {/* Private category action — one button per hidden category */}
                    {hiddenCategories.length > 0 && (
                      <div className="w-36 shrink-0 flex flex-col gap-1 items-center">
                        {hiddenCategories.map((cat) => {
                          const catId = String(cat._id);
                          const isAssigned = assignedIds.has(catId);
                          const isThisBusy = isBusy && busy[p._id] === catId;

                          return isAssigned ? (
                            // Already in this category — show badge + remove option
                            <div key={catId} className="flex items-center gap-1.5 w-full justify-center">
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-md font-semibold truncate max-w-[80px]"
                                style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}
                                title={cat.name}
                              >
                                ∞ {cat.name}
                              </span>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  if (!confirm(`Remove "${p.name}" from "${cat.name}"? Normal stock behaviour will be restored.`)) return;
                                  removeMutation.mutate({ categoryId: catId, productId: String(p._id) });
                                }}
                                className="text-[10px] px-1.5 py-0.5 rounded border transition-colors hover:bg-red-500/10 disabled:opacity-40 shrink-0"
                                style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}
                                title={isRTL ? 'إزالة' : 'Remove'}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            // Not assigned — show "Send to" button
                            <button
                              key={catId}
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                addMutation.mutate({ categoryId: catId, productId: String(p._id) })
                              }
                              className="w-full text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-500/10 disabled:opacity-40 truncate"
                              style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}
                              title={`Send to ${cat.name}`}
                            >
                              {isThisBusy
                                ? '…'
                                : isRTL
                                  ? `إرسال إلى ${cat.name}`
                                  : `→ ${cat.name}`}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Edit link */}
                    <div className="w-16 shrink-0 text-end">
                      <Link
                        href={`/admin/products/${p._id}/edit`}
                        className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/[0.06] inline-block"
                        style={{ borderColor: 'rgba(255,255,255,0.2)', color: MUTED }}
                      >
                        {isRTL ? 'تعديل' : 'Edit'}
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          {products.length > 0 && hiddenCategories.length > 0 && (
            <p className="text-xs text-center mt-4" style={{ color: MUTED2 }}>
              {isRTL
                ? 'المنتجات المُضافة إلى فئة خاصة تحصل على مخزون غير محدود — الطلبات لن تُنقص مخزونها.'
                : 'Products added to a private category get unlimited stock — orders will never deplete their inventory.'}
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
