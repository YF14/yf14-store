import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useQueryClient } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../../components/admin/AdminLayout';
import useAuthStore from '../../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../../lib/adminAccess';
import { useLang } from '../../../contexts/LanguageContext';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { formatIQD } from '../../../lib/currency';
import { invalidateProductCaches } from '../../../lib/invalidateProductCaches';

export default function AdminProductsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const { t } = useLang();
  const a = t.admin;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'products')) router.replace(getDefaultAdminPath(user));
  }, [user, isAuthReady, router]);

  const { data, isLoading, refetch } = useQuery(
    ['admin-products', page, search],
    () => {
      const params = new URLSearchParams({ page, limit: 15, showAll: 1 });
      if (search) params.append('search', search);
      return api.get(`/products?${params}`).then((r) => r.data);
    },
    { enabled: !!user && canAccessAdmin(user) && hasAdminPermission(user, 'products'), keepPreviousData: true }
  );

  const products = data?.products || [];
  const pages = data?.pages || 1;
  const total = data?.total || 0;

  const handleDelete = async (id, name) => {
    if (!confirm(a.deleteProductConfirm.replace('%s', name))) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success(a.productDeletedPermanently);
      invalidateProductCaches(queryClient);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || a.productDeleteFailed);
    }
  };

  if (!user || !canAccessAdmin(user) || !hasAdminPermission(user, 'products')) return null;

  return (
    <AdminLayout>
      <NextSeo title={`${a.products} — Admin`} />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-light">{a.products}</h1>
          <p className="text-sm text-brand-warm-gray">{total} {a.totalProducts}</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">{a.addProduct}</Link>
      </div>

      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={a.searchProducts}
          className="input-luxury max-w-xs"
        />
      </div>

      <div className="bg-white border border-brand-black/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-brand-black/10">
            <tr>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.product}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden md:table-cell">{a.category}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.price}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden sm:table-cell">{a.stock}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden lg:table-cell">{a.statusLabel}</th>
              <th className="text-end px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.actions}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-brand-black/5">
                  <td className="px-4 py-3" colSpan={6}><div className="h-5 skeleton" /></td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-brand-warm-gray">{a.noProductsFound}</td></tr>
            ) : (
              products.map((product) => {
                const totalStock = product.variants?.reduce((s, v) => s + v.stock, 0) || 0;
                const hasLowStock = product.variants?.some((v) => v.stock <= 5);
                return (
                  <tr key={product._id} className="border-b border-brand-black/5 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 relative bg-gray-50 flex-shrink-0">
                          {product.images?.[0]?.url && (
                            <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="40px" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                          <p className="text-xs text-brand-warm-gray">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-warm-gray hidden md:table-cell">{product.category?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{formatIQD(product.price)}</span>
                      {product.comparePrice > product.price && (
                        <span className="text-xs text-brand-warm-gray line-through ms-1">{formatIQD(product.comparePrice)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={hasLowStock ? 'text-amber-600 font-medium' : 'text-brand-warm-gray'}>
                        {totalStock} {hasLowStock && '⚠'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {product.isFeatured && <span className="text-xs px-2 py-0.5 bg-brand-gold/10 text-brand-gold">{a.featured}</span>}
                        {product.isNewArrival && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600">{a.newArrival}</span>}
                        {product.isBestSeller && <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600">{a.bestSeller}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product._id}/edit`} className="text-xs px-3 py-1 border border-brand-black/20 hover:border-brand-gold text-brand-warm-gray hover:text-brand-gold transition-colors">
                          {a.edit}
                        </Link>
                        <button type="button" onClick={() => handleDelete(product._id, product.name)} className="text-xs px-3 py-1 border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors">
                          {a.deleteProduct}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`w-9 h-9 text-xs border transition-colors ${page === i + 1 ? 'bg-brand-black text-white border-brand-black' : 'border-brand-black/20 hover:border-brand-gold text-brand-warm-gray'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
