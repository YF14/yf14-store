import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../store/authStore';
import api from '../../lib/api';

const STATUS_COLORS = {
  pending: 'text-amber-600 bg-amber-50',
  confirmed: 'text-blue-600 bg-blue-50',
  processing: 'text-purple-600 bg-purple-50',
  shipped: 'text-indigo-600 bg-indigo-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
  refunded: 'text-gray-600 bg-gray-100',
};

export default function OrdersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);

  useEffect(() => { if (!user) router.push('/login'); }, [user]);

  const { data, isLoading } = useQuery(
    ['my-orders', page],
    () => api.get(`/orders/my-orders?page=${page}&limit=10`).then(r => r.data),
    { enabled: !!user, keepPreviousData: true }
  );

  const orders = data?.orders || [];
  const pages = data?.pages || 1;

  if (!user) return null;

  return (
    <Layout>
      <NextSeo title="My Orders" />
      <div className="container-luxury py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/account" className="text-brand-warm-gray hover:text-brand-gold transition-colors text-sm">← Account</Link>
        </div>
        <h1 className="font-display text-4xl font-light mb-10">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 skeleton" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-3xl text-brand-warm-gray mb-6">No orders yet</p>
            <Link href="/products" className="btn-primary">Discover Our Collection</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link key={order._id} href={`/account/orders/${order._id}`}
                className="block border border-brand-black/10 hover:border-brand-gold transition-colors group">
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-medium group-hover:text-brand-gold transition-colors">{order.orderNumber}</p>
                      <p className="text-xs text-brand-warm-gray mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <span className={`text-xs px-3 py-1 font-medium ${STATUS_COLORS[order.status] || ''}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <p className="font-medium">${order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {order.items.slice(0, 4).map((item, i) => (
                      <div key={i} className="w-14 h-18 relative bg-gray-50 flex-shrink-0 overflow-hidden" style={{ height: '72px' }}>
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                        )}
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-14 h-18 bg-gray-100 flex items-center justify-center text-xs text-brand-warm-gray" style={{ height: '72px' }}>
                        +{order.items.length - 4}
                      </div>
                    )}
                    <div className="ml-auto text-xs text-brand-warm-gray">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      {order.trackingNumber && <span className="ml-3 text-brand-gold">Track: {order.trackingNumber}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {pages > 1 && (
              <div className="flex justify-center gap-2 pt-6">
                {Array.from({ length: pages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 text-xs border transition-colors ${page === i + 1 ? 'bg-brand-black text-white border-brand-black' : 'border-brand-black/20 hover:border-brand-gold text-brand-warm-gray'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
