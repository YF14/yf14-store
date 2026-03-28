import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../store/authStore';
import { canAccessAdmin, hasAdminPermission, getDefaultAdminPath } from '../../lib/adminAccess';
import { useLang } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import { formatIQD } from '../../lib/currency';

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#6b7280',
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const { t } = useLang();
  const a = t.admin;
  const st = t.status;
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) router.push('/login');
    else if (!canAccessAdmin(user)) router.push('/');
    else if (!hasAdminPermission(user, 'analytics')) router.replace(getDefaultAdminPath(user));
  }, [user, isAuthReady, router]);

  const enabled = !!user && canAccessAdmin(user) && hasAdminPermission(user, 'analytics');

  const { data: dashData } = useQuery('admin-dashboard', () => api.get('/analytics/dashboard').then((r) => r.data), { enabled });
  const { data: chartData } = useQuery(['chart', days], () => api.get(`/analytics/revenue-chart?days=${days}`).then((r) => r.data), { enabled });
  const { data: topProducts } = useQuery('top-products', () => api.get('/analytics/top-products?limit=10').then((r) => r.data), { enabled });
  const { data: statusData } = useQuery('orders-by-status', () => api.get('/analytics/orders-by-status').then((r) => r.data), { enabled });
  const { data: inventoryData } = useQuery('inventory', () => api.get('/analytics/inventory').then((r) => r.data), { enabled });

  const revenueChart = chartData?.data || [];
  const stats = dashData || {};
  const topItems = topProducts?.products || [];
  const statusChart = (statusData?.data || []).map((d) => ({
    name: st[d._id] || d._id,
    value: d.count,
    fill: STATUS_COLORS[d._id] || '#8c8c8c',
  }));
  const inventory = inventoryData?.inventory || [];
  const lowStockItems = inventory.flatMap((p) => p.variants.filter((v) => v.isLow).map((v) => ({ product: p.name, ...v })));

  const PERIOD_OPTIONS = [
    { label: a.days7, value: 7 },
    { label: a.days30, value: 30 },
    { label: a.days90, value: 90 },
  ];

  if (!user || !canAccessAdmin(user) || !hasAdminPermission(user, 'analytics')) return null;

  return (
    <AdminLayout>
      <NextSeo title={`${a.analytics} — Admin`} />
      <h1 className="font-display text-3xl font-light mb-8">{a.analytics}</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: a.totalRevenue, value: formatIQD(stats.revenue?.total), sub: `${formatIQD(stats.revenue?.thisMonth)} ${a.thisMonth}` },
          { label: a.totalOrders, value: stats.orders?.total || 0, sub: `${stats.orders?.thisMonth || 0} ${a.thisMonth}` },
          { label: a.customers, value: stats.users?.total || 0, sub: `${stats.users?.thisMonth || 0} ${a.thisMonth}` },
          { label: a.lowStockAlerts, value: lowStockItems.length, sub: `${inventory.length} ${a.activeProductsTracked}` },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-brand-black/10 p-5">
            <p className="text-xs tracking-widest uppercase text-brand-warm-gray mb-1">{card.label}</p>
            <p className="text-2xl font-light font-display">{card.value}</p>
            <p className="text-xs text-brand-warm-gray mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {/* Revenue chart with period toggle */}
        <div className="bg-white border border-brand-black/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-light">{a.revenue}</h2>
            <div className="flex gap-1">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  className={`text-xs px-3 py-1.5 border transition-colors ${
                    days === opt.value ? 'bg-brand-black text-white border-brand-black' : 'border-brand-black/20 text-brand-warm-gray hover:border-brand-gold'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a96e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#c9a96e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#8c8c8c' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8c8c8c' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Number(v).toLocaleString()}`} />
              <Tooltip formatter={(v) => [formatIQD(v), a.revenue]} contentStyle={{ border: '1px solid #e8e4e0', borderRadius: '2px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#c9a96e" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Two-col: Orders chart + Orders by status */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white border border-brand-black/10 p-6">
            <h2 className="font-display text-xl font-light mb-6">{a.ordersLast} {days === 7 ? a.days7 : days === 30 ? a.days30 : a.days90}</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#8c8c8c' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8c8c8c' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ border: '1px solid #e8e4e0', borderRadius: '2px', fontSize: '12px' }} />
                <Bar dataKey="orders" fill="#0a0a0a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-brand-black/10 p-6">
            <h2 className="font-display text-xl font-light mb-6">{a.ordersByStatus}</h2>
            {statusChart.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {statusChart.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ border: '1px solid #e8e4e0', borderRadius: '2px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {statusChart.map((s) => (
                    <div key={s.name} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.fill }} />
                      <span className="text-brand-warm-gray flex-1">{s.name}</span>
                      <span className="font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-brand-warm-gray">{a.noOrderData}</p>
            )}
          </div>
        </div>

        {/* Top selling products */}
        <div className="bg-white border border-brand-black/10 p-6">
          <h2 className="font-display text-xl font-light mb-6">{a.topSellingProducts}</h2>
          {topItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-brand-black/10">
                  <tr>
                    <th className="text-start px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">#</th>
                    <th className="text-start px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.product}</th>
                    <th className="text-start px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.unitsSold}</th>
                    <th className="text-start px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.revenue}</th>
                    <th className="text-start px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.price}</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map((p, i) => (
                    <tr key={p._id} className="border-b border-brand-black/5 hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-brand-warm-gray">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          {p.image && <img src={p.image} alt={p.name} className="w-8 h-10 object-cover" />}
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-medium">{p.unitsSold}</td>
                      <td className="px-3 py-2.5 text-brand-gold font-medium">{formatIQD(p.revenue)}</td>
                      <td className="px-3 py-2.5 text-brand-warm-gray">{formatIQD(p.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-brand-warm-gray">{a.noSalesData}</p>
          )}
        </div>

        {/* Inventory overview */}
        <div className="bg-white border border-brand-black/10 p-6">
          <h2 className="font-display text-xl font-light mb-2">{a.inventoryOverview}</h2>
          <p className="text-sm text-brand-warm-gray mb-6">{inventory.length} {a.activeProductsTracked}</p>

          {lowStockItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 mb-6">
              <h3 className="text-sm font-medium text-amber-800 mb-3">⚠ {lowStockItems.length} {a.lowStockAlerts}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                {lowStockItems.map((item, i) => (
                  <div key={i} className="text-xs bg-white border border-amber-200 px-3 py-2">
                    <span className="font-medium text-amber-700">{item.product}</span>
                    <span className="text-brand-warm-gray ms-2">{item.size}/{item.color}: {item.stock} {a.left}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-brand-black/10">
                <tr>
                  <th className="text-start px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.product}</th>
                  <th className="text-start px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.totalStock}</th>
                  <th className="text-start px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.totalSold}</th>
                  <th className="text-start px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">{a.variants}</th>
                </tr>
              </thead>
              <tbody>
                {inventory.slice(0, 20).map((product) => (
                  <tr key={product.id} className="border-b border-brand-black/5 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-sm">{product.name}</td>
                    <td className="px-3 py-2.5">
                      <span className={product.totalStock <= 5 ? 'text-red-600 font-medium' : product.totalStock <= 15 ? 'text-amber-600' : 'text-brand-black'}>
                        {product.totalStock}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-brand-warm-gray">{product.totalSold}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {product.variants.slice(0, 4).map((v, i) => (
                          <span key={i} className={`text-xs px-1.5 py-0.5 ${v.isLow ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-brand-warm-gray'}`}>
                            {v.size}/{v.color}: {v.stock}
                          </span>
                        ))}
                        {product.variants.length > 4 && <span className="text-xs text-brand-warm-gray">+{product.variants.length - 4}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
