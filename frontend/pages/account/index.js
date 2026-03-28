import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';
import { canAccessAdmin, getDefaultAdminPath } from '../../lib/adminAccess';
import { formatIQD } from '../../lib/currency';
import { useLang } from '../../contexts/LanguageContext';

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const logout = useAuthStore((s) => s.logout);
  const { t, isRTL } = useLang();

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) router.push('/login');
  }, [user, isAuthReady]);

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

  const statusLabel = (s) => (t.status[s] ? t.status[s] : s);

  if (!user) return null;

  return (
    <Layout>
      <NextSeo title={t.account.title} />
      <div className="container-luxury py-12" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="grid md:grid-cols-[240px_1fr] gap-10">
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
                <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-brand-gold text-white">{t.account.adminBadge}</span>
              )}
              {user.role === 'staff' && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-indigo-700 text-white">{t.account.staffBadge}</span>
              )}
            </div>
            <nav className="space-y-1">
              {[
                { href: '/account', label: t.account.overview },
                { href: '/account/orders', label: t.account.myOrdersNav },
                { href: '/account/wishlist', label: t.account.wishlist },
                { href: '/account/profile', label: t.account.profileSettings },
                { href: '/account/addresses', label: t.account.addressesNav },
                ...(canAccessAdmin(user) ? [{ href: getDefaultAdminPath(user), label: t.account.adminPanelLink }] : []),
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
                {t.account.signOut}
              </button>
            </nav>
          </aside>

          <div>
            <h1 className="font-display text-4xl font-light mb-8">{t.account.welcomeBack}, {user.firstName}</h1>

            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { label: t.account.totalOrdersStat, value: ordersData?.total || 0 },
                { label: t.account.wishlistItemsStat, value: '—' },
                { label: t.account.memberSince, value: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
              ].map(stat => (
                <div key={stat.label} className="border border-brand-black/10 p-5 text-center">
                  <p className="font-display text-3xl font-light mb-1">{stat.value}</p>
                  <p className="text-xs tracking-wider uppercase text-brand-warm-gray">{stat.label}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-display text-2xl font-light">{t.account.recentOrdersTitle}</h2>
                <Link href="/account/orders" className="btn-ghost text-xs">{t.account.viewAllArrow}</Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="border border-brand-black/10 p-10 text-center">
                  <p className="text-brand-warm-gray mb-4">{t.account.noOrders}</p>
                  <Link href="/products" className="btn-primary">{t.account.startShopping}</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map(order => (
                    <Link key={order._id} href={`/account/orders/${order._id}`}
                      className="flex items-center justify-between border border-brand-black/10 p-4 hover:border-brand-gold transition-colors group">
                      <div>
                        <p className="text-sm font-medium group-hover:text-brand-gold transition-colors">{order.orderNumber}</p>
                        <p className="text-xs text-brand-warm-gray">
                          {new Date(order.createdAt).toLocaleDateString('en-US')} · {order.items.length}{' '}
                          {order.items.length === 1 ? t.account.itemSingular : t.account.itemsPlural}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-sm font-medium ${statusColor[order.status] || 'text-gray-600 bg-gray-50'}`}>
                          {statusLabel(order.status)}
                        </span>
                        <p className="text-sm font-medium mt-1">{formatIQD(order.total)}</p>
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
