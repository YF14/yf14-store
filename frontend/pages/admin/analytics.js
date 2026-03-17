import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => { if (user && user.role !== 'admin') router.push('/'); }, [user]);

  const { data: dashData } = useQuery('admin-dashboard', () => api.get('/analytics/dashboard').then(r => r.data), { enabled: !!user && user.role === 'admin' });
  const { data: chart30 } = useQuery('chart-30', () => api.get('/analytics/revenue-chart?days=30').then(r => r.data), { enabled: !!user && user.role === 'admin' });
  const { data: inventoryData } = useQuery('inventory', () => api.get('/analytics/inventory').then(r => r.data), { enabled: !!user && user.role === 'admin' });

  const chartData = chart30?.data || [];
  const inventory = inventoryData?.inventory || [];
  const stats = dashData || {};

  const lowStockItems = inventory.flatMap(p =>
    p.variants.filter(v => v.isLow).map(v => ({ product: p.name, ...v }))
  );

  if (!user || user.role !== 'admin') return null;

  return (
    <AdminLayout>
      <NextSeo title="Analytics — Admin" />
      <h1 className="font-display text-3xl font-light mb-8">Analytics</h1>

      <div className="space-y-8">
        {/* Revenue chart */}
        <div className="bg-white border border-brand-black/10 p-6">
          <h2 className="font-display text-xl font-light mb-6">Revenue — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a96e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#c9a96e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#8c8c8c' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8c8c8c' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [`$${Number(v).toFixed(2)}`, 'Revenue']} contentStyle={{ border: '1px solid #e8e4e0', borderRadius: '2px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#c9a96e" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders chart */}
        <div className="bg-white border border-brand-black/10 p-6">
          <h2 className="font-display text-xl font-light mb-6">Orders — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#8c8c8c' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8c8c8c' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ border: '1px solid #e8e4e0', borderRadius: '2px', fontSize: '12px' }} />
              <Bar dataKey="orders" fill="#0a0a0a" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory overview */}
        <div className="bg-white border border-brand-black/10 p-6">
          <h2 className="font-display text-xl font-light mb-2">Inventory Overview</h2>
          <p className="text-sm text-brand-warm-gray mb-6">{inventory.length} active products tracked</p>

          {/* Low stock alerts */}
          {lowStockItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 mb-6">
              <h3 className="text-sm font-medium text-amber-800 mb-3">⚠ {lowStockItems.length} Low Stock Alerts</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                {lowStockItems.map((item, i) => (
                  <div key={i} className="text-xs bg-white border border-amber-200 px-3 py-2">
                    <span className="font-medium text-amber-700">{item.product}</span>
                    <span className="text-brand-warm-gray ml-2">{item.size}/{item.color}: {item.stock} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-brand-black/10">
                <tr>
                  <th className="text-left px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">Product</th>
                  <th className="text-left px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">Total Stock</th>
                  <th className="text-left px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">Total Sold</th>
                  <th className="text-left px-3 py-2 text-xs tracking-widest uppercase text-brand-warm-gray font-medium">Variants</th>
                </tr>
              </thead>
              <tbody>
                {inventory.slice(0, 20).map(product => (
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
