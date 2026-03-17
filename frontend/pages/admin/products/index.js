import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../../components/admin/AdminLayout';
import useAuthStore from '../../../store/authStore';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => { if (user && user.role !== 'admin') router.push('/'); }, [user]);

  const { data, isLoading, refetch } = useQuery(
    ['admin-products', page, search],
    () => {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append('search', search);
      return api.get(`/products?${params}`).then(r => r.data);
    },
    { enabled: !!user && user.role === 'admin', keepPreviousData: true }
  );

  const products = data?.products || [];
  const pages = data?.pages || 1;
  const total = data?.total || 0;

  const handleDelete = async (id, name) => {
    if (!confirm(`Deactivate "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deactivated');
      refetch();
    } catch { toast.error('Failed'); }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <AdminLayout>
      <NextSeo title="Products — Admin" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-light">Products</h1>
          <p className="text-sm text-brand-warm-gray">{total} total products</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">+ Add Product</Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products..."
          className="input-luxury max-w-xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-brand-black/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-brand-black/10">
            <tr>
              <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">Product</th>
              <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">Price</th>
              <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden sm:table-cell">Stock</th>
              <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden lg:table-cell">Status</th>
              <th className="text-right px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">Actions</th>
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
              <tr><td colSpan={6} className="text-center py-12 text-brand-warm-gray">No products found</td></tr>
            ) : (
              products.map(product => {
                const totalStock = product.variants?.reduce((s, v) => s + v.stock, 0) || 0;
                const hasLowStock = product.variants?.some(v => v.stock <= 5);
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
                    <td className="px-4 py-3 text-brand-warm-gray hidden md:table-cell">
                      {product.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">${product.price.toFixed(2)}</span>
                      {product.comparePrice > product.price && (
                        <span className="text-xs text-brand-warm-gray line-through ml-1">${product.comparePrice.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={hasLowStock ? 'text-amber-600 font-medium' : 'text-brand-warm-gray'}>
                        {totalStock} {hasLowStock && '⚠'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {product.isFeatured && <span className="text-xs px-2 py-0.5 bg-brand-gold/10 text-brand-gold">Featured</span>}
                        {product.isNewArrival && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600">New</span>}
                        {product.isBestSeller && <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600">Best Seller</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product._id}/edit`}
                          className="text-xs px-3 py-1 border border-brand-black/20 hover:border-brand-gold text-brand-warm-gray hover:text-brand-gold transition-colors">
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(product._id, product.name)}
                          className="text-xs px-3 py-1 border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors">
                          Deactivate
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

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 text-xs border transition-colors ${page === i + 1 ? 'bg-brand-black text-white border-brand-black' : 'border-brand-black/20 hover:border-brand-gold text-brand-warm-gray'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
