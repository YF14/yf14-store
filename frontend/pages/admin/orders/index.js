import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../../components/admin/AdminLayout';
import useAuthStore from '../../../store/authStore';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const STATUSES = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: 'text-amber-600 bg-amber-50',
  confirmed: 'text-blue-600 bg-blue-50',
  processing: 'text-purple-600 bg-purple-50',
  shipped: 'text-indigo-600 bg-indigo-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => { if (user && user.role !== 'admin') router.push('/'); }, [user]);

  const { data, isLoading, refetch } = useQuery(
    ['admin-orders', page, statusFilter, search],
    () => {
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      return api.get(`/orders?${params}`).then(r => r.data);
    },
    { enabled: !!user && user.role === 'admin', keepPreviousData: true }
  );

  const orders = data?.orders || [];
  const pages = data?.pages || 1;
  const total = data?.total || 0;

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Order status updated to ${status}`);
      refetch();
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(null); }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <AdminLayout>
      <NextSeo title="Orders — Admin" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-light">Orders</h1>
          <p className="text-sm text-brand-warm-gray">{total} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search order number..." className="input-luxury text-sm py-2 w-52" />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-luxury text-sm py-2 cursor-pointer">
          {STATUSES.map(s => <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>)}
        </select>
      </div>

      <div className="bg-white border border-brand-black/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-brand-black/10">
            <tr>
              <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">Order</th>
              <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden sm:table-cell">Customer</th>
              <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden md:table-cell">Date</th>
              <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">Total</th>
              <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">Status</th>
              <th className="text-right px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">Update</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-brand-black/5">
                  <td className="px-4 py-3" colSpan={6}><div className="h-5 skeleton" /></td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-brand-warm-gray">No orders found</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order._id} className="border-b border-brand-black/5 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order._id}`} className="font-medium text-sm hover:text-brand-gold transition-colors">
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-brand-warm-gray">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-sm">{order.user?.firstName} {order.user?.lastName}</p>
                    <p className="text-xs text-brand-warm-gray">{order.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-brand-warm-gray text-xs hidden md:table-cell">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">${order.total?.toFixed(2)}</span>
                    <span className={`block text-xs mt-0.5 ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 font-medium ${STATUS_COLORS[order.status] || ''}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={order.status}
                      onChange={e => updateStatus(order._id, e.target.value)}
                      disabled={updating === order._id}
                      className="text-xs border border-brand-black/20 px-2 py-1 cursor-pointer hover:border-brand-gold transition-colors bg-white"
                    >
                      {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
