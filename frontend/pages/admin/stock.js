import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../lib/adminAccess';
import { useLang } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { pickListingImageUrl } from '../../lib/productMedia';

const LOW_STOCK_MAX = 3;

function variantDotColor(v) {
  const c = v.colorCode;
  if (typeof c === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(c.trim())) return c.trim();
  return '#9ca3af';
}

function productImageUrl(p) {
  const u = pickListingImageUrl(p);
  return u || null;
}

export default function AdminStockPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { t } = useLang();
  const a = t.admin;
  const pShop = t.product;
  const [busyKey, setBusyKey] = useState(null);
  const [flashProductId, setFlashProductId] = useState(null);
  /** Last button direction per variant — red (−) / green (+) until leave page or failed save */
  const [qtyLastDir, setQtyLastDir] = useState({});

  const canView =
    !!user && canAccessAdmin(user) && hasAdminPermission(user, 'stock');

  useEffect(() => {
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'stock')) router.replace(getDefaultAdminPath(user));
  }, [user, router]);

  /** On leave Stock, invalidate so next visit loads server order (last edited on top). While on page, order stays fixed. */
  useEffect(() => {
    if (!canView) return undefined;
    return () => {
      queryClient.invalidateQueries(['admin-stock-products']);
    };
  }, [canView, queryClient]);

  const { data, isLoading } = useQuery(
    ['admin-stock-products'],
    () =>
      api
        .get('/products?showAll=true&limit=500&sort=-lastStockUpdateAt')
        .then((r) => r.data),
    {
      enabled: canView,
      staleTime: 0,
      refetchOnMount: true,
    }
  );

  const setStock = useMutation(
    async ({ productId, variantId, stock }) => {
      const { data } = await api.patch(
        `/products/${productId}/variants/${variantId}/stock`,
        { stock }
      );
      return data;
    },
    {
      onMutate: ({ productId, variantId }) => {
        setBusyKey(`${productId}:${variantId}`);
      },
      onSettled: () => setBusyKey(null),
      onSuccess: (res, { productId }) => {
        const updated = res?.product;
        if (updated) {
          queryClient.setQueryData(['admin-stock-products'], (old) => {
            if (!old?.products) return old;
            const pid = String(productId);
            return {
              ...old,
              products: old.products.map((p) =>
                String(p._id) === pid ? updated : p
              ),
            };
          });
        }
        setFlashProductId(String(productId));
        window.setTimeout(() => setFlashProductId(null), 900);
        toast.success(a.stockUpdateSuccess, { duration: 2000 });
      },
      onError: (_, { productId, variantId }) => {
        toast.error(a.variantStockFailed);
        const k = `${productId}:${variantId}`;
        setQtyLastDir((prev) => {
          if (!prev[k]) return prev;
          const next = { ...prev };
          delete next[k];
          return next;
        });
      },
    }
  );

  const products = data?.products || [];

  const totalForProduct = (p) =>
    (p.variants || []).reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  const delta = (productId, variantId, current, d) => {
    const next = Math.max(0, Number(current) + d);
    const vKey = `${productId}:${variantId}`;
    const dir = d < 0 ? 'down' : 'up';
    setQtyLastDir((prev) => ({ ...prev, [vKey]: dir }));
    setStock.mutate({ productId, variantId, stock: next });
  };

  if (!user || !canView) return null;

  return (
    <AdminLayout>
      <NextSeo title={`${a.stockMenu} — Admin`} />

      <div className="max-w-[1600px]">
        <h1 className="text-[22px] font-medium text-brand-black mb-4">{a.stockMenu}</h1>

        {isLoading ? (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-brand-black/10 rounded-lg overflow-hidden"
              >
                <div className="h-40 skeleton" />
                <div className="p-3 space-y-2">
                  <div className="h-4 skeleton w-3/4" />
                  <div className="h-3 skeleton w-1/2" />
                  <div className="h-6 skeleton" />
                  <div className="h-6 skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-brand-warm-gray py-12 text-center">{a.noVariantsInCatalog}</p>
        ) : (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            }}
          >
            {products.map((p) => {
              const imgUrl = productImageUrl(p);
              const variants = p.variants || [];
              const total = totalForProduct(p);

              return (
                <article
                  key={p._id}
                  className={`bg-white border rounded-lg overflow-hidden shadow-sm transition-[box-shadow] duration-300 ${
                    flashProductId === String(p._id)
                      ? 'border-brand-gold ring-2 ring-brand-gold/50 ring-offset-2 border-brand-gold/80'
                      : 'border-brand-black/10'
                  }`}
                >
                  <div className="relative h-40 w-full bg-gray-100">
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={p.name || ''}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 200px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-brand-warm-gray text-xs">
                        —
                      </div>
                    )}
                  </div>
                  <div className="px-3 pt-2.5 pb-3">
                    <div className="text-sm font-medium text-brand-black mb-0.5 line-clamp-2">
                      {p.name}
                    </div>
                    <div className="text-xs text-brand-warm-gray mb-2.5">
                      {total} {pShop.inStockLabel}
                    </div>
                    {variants.length === 0 ? (
                      <p className="text-xs text-brand-warm-gray">—</p>
                    ) : (
                      variants.map((v) => {
                        const key = `${p._id}:${v._id}`;
                        const isBusy = busyKey === key;
                        const val = Number(v.stock) || 0;
                        const isLow = val <= LOW_STOCK_MAX;
                        const lastDir = qtyLastDir[key];
                        const pulseDown = lastDir === 'down';
                        const pulseUp = lastDir === 'up';

                        return (
                          <div
                            key={v._id}
                            className="flex items-center gap-2 mb-1.5 last:mb-0"
                          >
                            <div
                              className="w-[13px] h-[13px] rounded-full border border-brand-black/15 shrink-0"
                              style={{ background: variantDotColor(v) }}
                              title={v.color}
                            />
                            <span className="text-[11px] px-1.5 py-px rounded border border-brand-black/15 text-brand-warm-gray tabular-nums">
                              {v.size}
                            </span>
                            <div className="flex items-center gap-1.5 ms-auto">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => delta(p._id, v._id, v.stock, -1)}
                                className="w-[22px] h-[22px] rounded-[5px] border border-brand-black/15 bg-transparent text-brand-black text-[15px] leading-none flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                                aria-label="−"
                              >
                                −
                              </button>
                              <span
                                className={`min-w-[22px] text-center text-xs font-medium tabular-nums transition-colors duration-300 ${
                                  pulseDown
                                    ? 'text-red-600'
                                    : pulseUp
                                      ? 'text-green-600'
                                      : isLow
                                        ? 'text-[#A32D2D]'
                                        : 'text-brand-black'
                                }`}
                              >
                                {val}
                              </span>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => delta(p._id, v._id, v.stock, 1)}
                                className="w-[22px] h-[22px] rounded-[5px] border border-brand-black/15 bg-transparent text-brand-black text-[15px] leading-none flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                                aria-label="+"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
