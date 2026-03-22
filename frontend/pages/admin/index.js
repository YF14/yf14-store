import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../lib/adminAccess';
import { useLang } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import { formatIQD } from '../../lib/currency';

const STATUS_COLORS = {
  pending: 'text-amber-600 bg-amber-50',
  confirmed: 'text-blue-600 bg-blue-50',
  shipped: 'text-indigo-600 bg-indigo-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
};

function StatCard({ title, value, sub, icon }) {
  return (
    <div className="bg-white border border-brand-black/10 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-brand-warm-gray mb-2">{title}</p>
          <p className="font-display text-3xl font-light">{value}</p>
          {sub && <p className="text-xs text-brand-warm-gray mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 flex items-center justify-center text-lg bg-brand-gold/10">{icon}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { t } = useLang();
  const a = t.admin;
  const st = t.status;

  useEffect(() => {
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'dashboard')) router.replace(getDefaultAdminPath(user));
  }, [user, router]);

  const enabled = !!user && canAccessAdmin(user) && hasAdminPermission(user, 'dashboard');
  const { data } = useQuery('admin-dashboard', () => api.get('/analytics/dashboard').then((r) => r.data), { enabled });
  const { data: chartData } = useQuery('revenue-chart', () => api.get('/analytics/revenue-chart?days=30').then((r) => r.data), { enabled });

  if (!user || !canAccessAdmin(user) || !hasAdminPermission(user, 'dashboard')) return null;

  const stats = data || {};
  const chart = chartData?.data || [];
  const fmt = (v) => formatIQD(v);

  return (
    <AdminLayout>
      <NextSeo title={`${a.dashboard} — Admin`} />

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl font-light">{a.dashboard}</h1>
          <p className="text-sm text-brand-warm-gray">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={a.totalRevenue} value={fmt(stats.revenue?.total)} sub={`${a.thisMonth}: ${fmt(stats.revenue?.thisMonth)}`} icon="💰" />
          <StatCard title={a.totalOrders} value={stats.orders?.total?.toLocaleString() || '0'} sub={`${a.thisMonth}: ${stats.orders?.thisMonth || 0}`} icon="📦" />
          <StatCard title={a.customers} value={stats.users?.total?.toLocaleString() || '0'} sub={`${a.thisMonth}: +${stats.users?.thisMonth || 0}`} icon="👤" />
          <StatCard title={a.avgOrderValue} value={fmt(stats.orders?.total ? stats.revenue?.total / stats.orders?.total : 0)} sub={a.allTime} icon="📊" />
        </div>

        {chart.length > 0 && (
          <div className="bg-white border border-brand-black/10 p-6">
            <h2 className="font-display text-xl font-light mb-6">{a.revenueLast30}</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a96e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#c9a96e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#8c8c8c' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8c8c8c' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Number(v).toLocaleString()}`} />
                <Tooltip formatter={(v) => [formatIQD(v), a.revenue]} contentStyle={{ border: '1px solid #e8e4e0', borderRadius: '2px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#c9a96e" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-brand-black/10 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-display text-xl font-light">{a.recentOrders}</h2>
              <Link href="/admin/orders" className="text-xs text-brand-gold hover:underline">{a.viewAll} →</Link>
            </div>
            <div className="space-y-3">
              {(stats.recentOrders || []).map((order) => (
                <Link
                  key={order._id}
                  href={`/admin/orders/${order._id}`}
                  className="flex items-center justify-between py-2 border-b border-brand-black/5 hover:text-brand-gold transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium group-hover:text-brand-gold">{order.orderNumber}</p>
                    <p className="text-xs text-brand-warm-gray">
                      {order.guestInfo?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || a.guest}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 ${STATUS_COLORS[order.status] || ''}`}>
                      {st[order.status] || order.status}
                    </span>
                    <p className="text-sm mt-1">{formatIQD(order.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white border border-brand-black/10 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-display text-xl font-light">{a.bestSellers}</h2>
              <Link href="/admin/products" className="text-xs text-brand-gold hover:underline">{a.manage} →</Link>
            </div>
            <div className="space-y-3">
              {(stats.bestSellers || []).map((product, i) => (
                <div key={product._id} className="flex items-center gap-3 py-2 border-b border-brand-black/5">
                  <span className="text-xs text-brand-warm-gray w-4">{i + 1}</span>
                  <div className="w-10 h-12 relative bg-gray-50 flex-shrink-0">
                    {product.images?.[0]?.url && (
                      <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="40px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-brand-warm-gray">
                      {product.totalSold} {a.sold} · ⭐ {product.averageRating}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{formatIQD(product.price)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {stats.lowStock?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-6">
            <h2 className="font-display text-xl font-light mb-4 text-amber-800">⚠ {a.lowStockAlert}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.lowStock.slice(0, 6).map((product) => (
                <Link
                  key={product._id}
                  href="/admin/stock"
                  className="flex items-center gap-3 bg-white border border-amber-200 p-3 hover:border-amber-400 transition-colors"
                >
                  <span className="text-amber-600 text-lg">⚠</span>
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <div className="flex gap-2 mt-1">
                      {product.variants?.filter((v) => v.stock <= 5).map((v) => (
                        <span key={v._id} className="text-xs text-amber-600">
                          {v.size}/{v.color}: {v.stock}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
