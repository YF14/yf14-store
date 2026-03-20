import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'react-query';
import { NextSeo } from 'next-seo';
import { motion } from 'framer-motion';
import Layout from '../../../components/layout/Layout';
import useAuthStore from '../../../store/authStore';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { formatIQD } from '../../../lib/currency';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_COLORS = {
  pending: 'text-amber-600 bg-amber-50',
  confirmed: 'text-blue-600 bg-blue-50',
  processing: 'text-purple-600 bg-purple-50',
  shipped: 'text-indigo-600 bg-indigo-50',
  delivered: 'text-green-600 bg-green-50',
  cancelled: 'text-red-600 bg-red-50',
};

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, refetch } = useQuery(
    ['order', id],
    () => api.get(`/orders/${id}`).then(r => r.data),
    { enabled: !!id && !!user }
  );

  const order = data?.order;

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.post(`/orders/${id}/cancel`);
      toast.success('Order cancelled successfully');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot cancel order');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container-luxury py-12">
          <div className="h-8 skeleton w-48 mb-8" />
          <div className="h-64 skeleton" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container-luxury py-24 text-center">
          <h1 className="font-display text-4xl mb-4">Order not found</h1>
          <Link href="/account/orders" className="btn-primary">My Orders</Link>
        </div>
      </Layout>
    );
  }

  const stepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <Layout>
      <NextSeo title={`Order ${order.orderNumber}`} />
      <div className="container-luxury py-12">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
          <div>
            <Link href="/account/orders" className="text-sm text-brand-warm-gray hover:text-brand-gold mb-3 inline-block">← My Orders</Link>
            <h1 className="font-display text-4xl font-light">{order.orderNumber}</h1>
            <p className="text-sm text-brand-warm-gray mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm px-4 py-1.5 font-medium ${STATUS_COLORS[order.status] || ''}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            {['pending', 'confirmed'].includes(order.status) && (
              <button onClick={handleCancel} className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-4 py-1.5 hover:border-red-400 transition-colors">
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* Progress tracker */}
        {!isCancelled && (
          <div className="bg-white border border-brand-black/10 p-6 mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-4 h-px bg-gray-200" />
              <div
                className="absolute left-0 top-4 h-px bg-brand-gold transition-all duration-700"
                style={{ width: `${stepIdx === -1 ? 0 : (stepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
              {STATUS_STEPS.map((status, i) => (
                <div key={status} className="relative flex flex-col items-center gap-2 z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-colors ${
                    i <= stepIdx ? 'bg-brand-gold border-brand-gold text-white' : 'bg-white border-gray-200 text-gray-300'
                  }`}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs tracking-wider capitalize hidden sm:block ${i <= stepIdx ? 'text-brand-black' : 'text-brand-warm-gray'}`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
            {order.estimatedDelivery && (
              <p className="text-sm text-brand-warm-gray mt-6 text-center">
                Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
            {order.trackingNumber && (
              <p className="text-sm text-center mt-2">
                Tracking: <span className="font-medium text-brand-gold">{order.trackingNumber}</span>
                {order.shippingCarrier && <span className="text-brand-warm-gray"> via {order.shippingCarrier}</span>}
              </p>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Items */}
          <div>
            <h2 className="font-display text-2xl font-light mb-5">Items</h2>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 border border-brand-black/10 p-4">
                  <div className="w-20 h-28 relative bg-gray-50 flex-shrink-0">
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-brand-warm-gray mt-1">{item.size} · {item.color}</p>
                    <p className="text-xs text-brand-warm-gray">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium mt-2">{formatIQD(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary + Address */}
          <div className="space-y-6">
            {/* Order summary */}
            <div className="border border-brand-black/10 p-5">
              <h3 className="text-xs tracking-widest uppercase mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-brand-warm-gray"><span>Subtotal</span><span>{formatIQD(order.subtotal)}</span></div>
                <div className="flex justify-between text-brand-warm-gray"><span>Shipping</span><span>{order.shippingCost === 0 ? 'Free' : formatIQD(order.shippingCost)}</span></div>
                <div className="flex justify-between text-brand-warm-gray"><span>Tax</span><span>{formatIQD(order.tax)}</span></div>
                {order.promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount ({order.promoCode})</span><span>−{formatIQD(order.promoDiscount)}</span></div>
                )}
                <div className="flex justify-between font-medium pt-3 border-t border-brand-black/10">
                  <span className="text-xs tracking-widest uppercase">Total</span>
                  <span>{formatIQD(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping address */}
            <div className="border border-brand-black/10 p-5">
              <h3 className="text-xs tracking-widest uppercase mb-4">Shipping Address</h3>
              <div className="text-sm text-brand-warm-gray space-y-1">
                <p className="text-brand-black font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
              </div>
            </div>

            {/* Payment */}
            <div className="border border-brand-black/10 p-5">
              <h3 className="text-xs tracking-widest uppercase mb-4">Payment</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-brand-warm-gray">Status</span>
                <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
