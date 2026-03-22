import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import AdminLayout from '../../../components/admin/AdminLayout';
import useAuthStore from '../../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../../lib/adminAccess';
import { useLang } from '../../../contexts/LanguageContext';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { formatIQD } from '../../../lib/currency';

const STATUS_KEYS = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
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
  const { t } = useLang();
  const a = t.admin;
  const st = t.status;
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'orders')) router.replace(getDefaultAdminPath(user));
  }, [user, router]);

  const { data, isLoading, refetch } = useQuery(
    ['admin-orders', page, statusFilter, search],
    () => {
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      return api.get(`/orders?${params}`).then((r) => r.data);
    },
    { enabled: !!user && canAccessAdmin(user) && hasAdminPermission(user, 'orders'), keepPreviousData: true }
  );

  const orders = data?.orders || [];
  const pages = data?.pages || 1;
  const total = data?.total || 0;

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`${a.statusUpdated} ${st[status] || status}`);
      refetch();
    } catch {
      toast.error(a.failedUpdateStatus);
    } finally {
      setUpdating(null);
    }
  };

  if (!user || !canAccessAdmin(user) || !hasAdminPermission(user, 'orders')) return null;

  return (
    <AdminLayout>
      <NextSeo title={`${a.orders} — Admin`} />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-light">{a.orders}</h1>
          <p className="text-sm text-brand-warm-gray">{total} {a.totalOrdersLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={a.searchOrders}
          className="input-luxury text-sm py-2 w-52"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-luxury text-sm py-2 cursor-pointer"
        >
          {STATUS_KEYS.map((s) => (
            <option key={s} value={s}>{s ? (st[s] || s) : a.allStatuses}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-brand-black/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-brand-black/10">
            <tr>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.order}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden sm:table-cell">{a.customer}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium hidden md:table-cell">{a.date}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.total}</th>
              <th className="text-start px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.statusLabel}</th>
              <th className="text-end px-4 py-3 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.update}</th>
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
              <tr><td colSpan={6} className="text-center py-12 text-brand-warm-gray">{a.noOrdersFound}</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id} className="border-b border-brand-black/5 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order._id}`} className="font-medium text-sm hover:text-brand-gold transition-colors">
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-brand-warm-gray">
                      {order.items?.length} {order.items?.length !== 1 ? a.items : a.item}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-sm">
                      {order.guestInfo?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || a.guest}
                      {order.guestInfo && <span className="ms-1 text-xs bg-amber-100 text-amber-700 px-1 rounded">{a.guest}</span>}
                    </p>
                    <p className="text-xs text-brand-warm-gray">
                      {order.guestInfo?.email || order.guestInfo?.phone || order.user?.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-brand-warm-gray text-xs hidden md:table-cell">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{formatIQD(order.total)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 font-medium ${STATUS_COLORS[order.status] || ''}`}>
                      {st[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      disabled={updating === order._id}
                      className="text-xs border border-brand-black/20 px-2 py-1 cursor-pointer hover:border-brand-gold transition-colors bg-white"
                    >
                      {STATUS_KEYS.filter(Boolean).map((s) => (
                        <option key={s} value={s}>{st[s] || s}</option>
                      ))}
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
            <button key={i} onClick={() => setPage(i + 1)} className={`w-9 h-9 text-xs border transition-colors ${page === i + 1 ? 'bg-brand-black text-white border-brand-black' : 'border-brand-black/20 hover:border-brand-gold text-brand-warm-gray'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
