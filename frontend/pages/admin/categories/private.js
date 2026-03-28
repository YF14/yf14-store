import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../../components/admin/AdminLayout';
import useAuthStore from '../../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../../lib/adminAccess';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const BG = '#0f1117';
const CARD = '#1a1d2e';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT = '#e8e8f0';
const MUTED = '#9ca3af';
const MUTED2 = '#6b7280';

export default function PrivateCategoryProductsPage() {
  const router = useRouter();
  const { id: categoryId } = router.query;
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [addSearch, setAddSearch] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const canAccess = !!user && canAccessAdmin(user) && hasAdminPermission(user, 'categories');

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'categories')) router.replace(getDefaultAdminPath(user));
  }, [user, isAuthReady, router]);

  // Fetch the category info
  const { data: catData } = useQuery(
    ['admin-categories-all'],
    () => api.get('/categories/admin/all').then((r) => r.data),
    { enabled: canAccess }
  );
  const category = useMemo(
    () => (catData?.categories || []).find((c) => String(c._id) === String(categoryId)),
    [catData, categoryId]
  );

  // Products already in this hidden category
  const { data: taggedData, isLoading: taggedLoading } = useQuery(
    ['private-cat-products', categoryId],
    () => api.get(`/categories/hidden/${categoryId}/products`).then((r) => r.data),
    { enabled: canAccess && !!categoryId }
  );
  const taggedProducts = taggedData?.products || [];

  // All products (for adding)
  const { data: allData, isLoading: allLoading } = useQuery(
    ['admin-all-products-for-private'],
    () => api.get('/products?showAll=1&limit=500&sort=-createdAt').then((r) => r.data),
    { enabled: canAccess && showAddPanel }
  );
  const allProducts = allData?.products || [];

  // Products not yet tagged
  const taggedIds = useMemo(() => new Set(taggedProducts.map((p) => String(p._id))), [taggedProducts]);
  const availableToAdd = useMemo(
    () => allProducts.filter((p) => !taggedIds.has(String(p._id))),
    [allProducts, taggedIds]
  );

  const filteredTagged = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return taggedProducts;
    return taggedProducts.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.slug?.includes(q)
    );
  }, [taggedProducts, search]);

  const filteredAvailable = useMemo(() => {
    const q = addSearch.toLowerCase().trim();
    if (!q) return availableToAdd;
    return availableToAdd.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.slug?.includes(q)
    );
  }, [availableToAdd, addSearch]);

  const addMutation = useMutation(
    (productIds) => api.post(`/categories/hidden/${categoryId}/products`, { productIds }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['private-cat-products', categoryId]);
        setSelectedToAdd([]);
        setShowAddPanel(false);
        toast.success('Products added to private category');
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Failed to add products'),
    }
  );

  const removeMutation = useMutation(
    (productId) => api.delete(`/categories/hidden/${categoryId}/products/${productId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['private-cat-products', categoryId]);
        toast.success('Product removed from private category');
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Failed to remove product'),
    }
  );

  const toggleSelect = (id) => {
    setSelectedToAdd((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (!user || !canAccess) return null;

  return (
    <AdminLayout>
      <NextSeo title={`Private Category: ${category?.name || '…'} — Admin`} />
      <div
        className="-mx-8 -mt-8 -mb-8 px-6 sm:px-8 pt-8 pb-16 min-h-screen"
        style={{ backgroundColor: BG, color: TEXT }}
      >
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin/categories"
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
              style={{ borderColor: BORDER, color: MUTED }}
            >
              ← Categories
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 mt-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-red-500/15 text-red-300 border border-red-500/25">
                  PRIVATE
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: TEXT }}>
                  {category?.name || '…'}
                </h1>
              </div>
              <p className="text-sm" style={{ color: MUTED }}>
                Products in this private category have <strong className="text-white/80">unlimited stock</strong> — orders never deplete their inventory.
                This category is completely invisible to customers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setShowAddPanel(true); setSelectedToAdd([]); }}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-white/[0.06]"
              style={{ borderColor: 'rgba(255,255,255,0.25)', color: TEXT }}
            >
              + Add Products
            </button>
          </div>

          {/* Stats bar */}
          <div
            className="rounded-xl border px-4 py-3 mb-6 flex items-center gap-6 text-sm"
            style={{ backgroundColor: CARD, borderColor: BORDER }}
          >
            <span style={{ color: MUTED }}>
              Products with unlimited stock:{' '}
              <strong style={{ color: TEXT }}>{taggedProducts.length}</strong>
            </span>
            <span className="h-4 w-px" style={{ backgroundColor: BORDER }} />
            <span className="text-xs" style={{ color: MUTED2 }}>
              Slug: <code className="font-mono">{category?.slug || '…'}</code>
            </span>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products in this category…"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none border transition-colors focus:border-red-500/40"
              style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }}
            />
          </div>

          {/* Tagged products table */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: CARD, borderColor: BORDER }}>
            <div
              className="flex items-center gap-3 py-2 px-4 border-b text-[10px] uppercase tracking-wider font-semibold"
              style={{ borderColor: BORDER, color: MUTED2 }}
            >
              <span className="flex-1">Product</span>
              <span className="w-28 shrink-0 text-center">Primary Category</span>
              <span className="w-20 shrink-0 text-center">Stock</span>
              <span className="w-24 shrink-0 text-end">Action</span>
            </div>

            {taggedLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: BORDER }}>
                  <div className="h-4 rounded bg-white/5 flex-1" />
                </div>
              ))
            ) : filteredTagged.length === 0 ? (
              <div className="py-16 text-center text-sm" style={{ color: MUTED }}>
                {taggedProducts.length === 0
                  ? 'No products assigned yet. Click "Add Products" to get started.'
                  : 'No products match your search.'}
              </div>
            ) : (
              filteredTagged.map((p) => {
                const thumb = p.images?.[0]?.url;
                const totalStock = (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
                return (
                  <div
                    key={p._id}
                    className="flex items-center gap-3 px-4 py-3 border-b transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: BORDER }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {thumb ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                          <Image src={thumb} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-lg" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                          👗
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: TEXT }}>{p.name}</p>
                        <p className="text-xs font-mono truncate" style={{ color: MUTED2 }}>{p.slug}</p>
                      </div>
                    </div>
                    <div className="w-28 shrink-0 text-center">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: MUTED }}>
                        {p.category?.name || '—'}
                      </span>
                    </div>
                    <div className="w-20 shrink-0 text-center">
                      <span className="text-xs font-semibold text-emerald-400">∞ Unlimited</span>
                      <p className="text-[10px] mt-0.5" style={{ color: MUTED2 }}>
                        (base: {totalStock})
                      </p>
                    </div>
                    <div className="w-24 shrink-0 text-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm(`Remove "${p.name}" from this private category? Its normal stock will be restored.`)) return;
                          removeMutation.mutate(String(p._id));
                        }}
                        disabled={removeMutation.isLoading}
                        className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-500/10 disabled:opacity-40"
                        style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add products panel */}
      {showAddPanel && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
          onClick={() => setShowAddPanel(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh]"
            style={{ backgroundColor: CARD, borderColor: 'rgba(239,68,68,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 border-b shrink-0" style={{ borderColor: BORDER }}>
              <h2 className="text-lg font-bold mb-1" style={{ color: TEXT }}>
                Add Products to Private Category
              </h2>
              <p className="text-xs" style={{ color: MUTED }}>
                Select existing products to give them unlimited stock. Their primary category remains unchanged.
              </p>
              <input
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                placeholder="Search products…"
                className="mt-3 w-full px-3 py-2.5 rounded-lg text-sm border outline-none"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderColor: BORDER, color: TEXT }}
                autoFocus
              />
            </div>

            <div className="overflow-y-auto flex-1 px-2 py-2">
              {allLoading ? (
                <div className="py-12 text-center text-sm" style={{ color: MUTED }}>Loading products…</div>
              ) : filteredAvailable.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: MUTED }}>
                  {availableToAdd.length === 0 ? 'All products are already in this category.' : 'No matches.'}
                </div>
              ) : (
                filteredAvailable.map((p) => {
                  const thumb = p.images?.[0]?.url;
                  const checked = selectedToAdd.includes(String(p._id));
                  return (
                    <label
                      key={p._id}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-white/[0.04]"
                      style={{ backgroundColor: checked ? 'rgba(239,68,68,0.08)' : 'transparent' }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(String(p._id))}
                        className="rounded border-gray-500 shrink-0"
                      />
                      {thumb ? (
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white/5">
                          <Image src={thumb} alt={p.name} width={36} height={36} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-base" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                          👗
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: TEXT }}>{p.name}</p>
                        <p className="text-xs truncate" style={{ color: MUTED2 }}>
                          {p.category?.name || '—'} · {p.variants?.length || 0} variants
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-between gap-3 shrink-0" style={{ borderColor: BORDER }}>
              <span className="text-xs" style={{ color: MUTED }}>
                {selectedToAdd.length} product{selectedToAdd.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPanel(false)}
                  className="px-4 py-2 rounded-xl text-sm border"
                  style={{ borderColor: BORDER, color: MUTED }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => addMutation.mutate(selectedToAdd)}
                  disabled={selectedToAdd.length === 0 || addMutation.isLoading}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white border border-red-500/40 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-40 transition-colors"
                >
                  {addMutation.isLoading ? 'Saving…' : `Add ${selectedToAdd.length || ''} Product${selectedToAdd.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
