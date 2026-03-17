import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);

  const { data: ordersData } = useQuery('my-orders-recent', () =>
    api.get('/orders/my-orders?limit=3').then(r => r.data), { enabled: !!user }
  );

  const recentOrders = ordersData?.orders || [];

  const statusColor = {
    pending: 'text-amber-600 bg-amber-50',
    confirmed: 'text-blue-600 bg-blue-50',
    processing: 'text-purple-600 bg-purple-50',
    shipped: 'text-indigo-600 bg-indigo-50',
    delivered: 'text-green-600 bg-green-50',
    cancelled: 'text-red-600 bg-red-50',
  };

  if (!user) return null;

  return (
    <Layout>
      <NextSeo title="My Account" />
      <div className="container-luxury py-12">
        <div className="grid md:grid-cols-[240px_1fr] gap-10">
          {/* Sidebar */}
          <aside>
            <div className="border border-brand-black/10 p-6 mb-4">
              <div className="w-16 h-16 bg-brand-cream rounded-full flex items-center justify-center mb-3 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-2xl text-brand-warm-gray">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                )}
              </div>
              <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-brand-warm-gray">{user.email}</p>
              {user.role === 'admin' && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-brand-gold text-white">Admin</span>
              )}
            </div>
            <nav className="space-y-1">
              {[
                { href: '/account', label: 'Overview' },
                { href: '/account/orders', label: 'My Orders' },
                { href: '/account/wishlist', label: 'Wishlist' },
                { href: '/account/profile', label: 'Profile Settings' },
                { href: '/account/addresses', label: 'Addresses' },
                ...(user.role === 'admin' ? [{ href: '/admin', label: '⚡ Admin Panel' }] : []),
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className={`block px-4 py-2.5 text-sm transition-colors ${
                    router.pathname === link.href
                      ? 'bg-brand-black text-white'
                      : 'hover:bg-brand-cream text-brand-warm-gray hover:text-brand-black'
                  }`}>
                  {link.label}
                </Link>
              ))}
              <button onClick={logout}
                className="block w-full text-left px-4 py-2.5 text-sm text-brand-warm-gray hover:text-red-500 transition-colors">
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Main */}
          <div>
            <h1 className="font-display text-4xl font-light mb-8">Welcome back, {user.firstName}</h1>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { label: 'Total Orders', value: ordersData?.total || 0 },
                { label: 'Wishlist Items', value: '—' },
                { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' }) },
              ].map(stat => (
                <div key={stat.label} className="border border-brand-black/10 p-5 text-center">
                  <p className="font-display text-3xl font-light mb-1">{stat.value}</p>
                  <p className="text-xs tracking-wider uppercase text-brand-warm-gray">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            <div>
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-display text-2xl font-light">Recent Orders</h2>
                <Link href="/account/orders" className="btn-ghost text-xs">View All →</Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="border border-brand-black/10 p-10 text-center">
                  <p className="text-brand-warm-gray mb-4">No orders yet</p>
                  <Link href="/products" className="btn-primary">Start Shopping</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map(order => (
                    <Link key={order._id} href={`/account/orders/${order._id}`}
                      className="flex items-center justify-between border border-brand-black/10 p-4 hover:border-brand-gold transition-colors group">
                      <div>
                        <p className="text-sm font-medium group-hover:text-brand-gold transition-colors">{order.orderNumber}</p>
                        <p className="text-xs text-brand-warm-gray">{new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-sm font-medium ${statusColor[order.status] || 'text-gray-600 bg-gray-50'}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <p className="text-sm font-medium mt-1">${order.total.toFixed(2)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
