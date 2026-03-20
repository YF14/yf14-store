import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Layout from '../components/layout/Layout';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      color: '#0a0a0a',
      fontFamily: 'Jost, sans-serif',
      '::placeholder': { color: '#8c8c8c' },
    },
    invalid: { color: '#ef4444' },
  },
};

function CheckoutForm({ cart, subtotal }) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const user = useAuthStore((s) => s.user);
  const clearCart = useCartStore((s) => s.clearCart);
  const [loading, setLoading] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [step, setStep] = useState(1); // 1=shipping, 2=payment
  const [address, setAddress] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
  });

  const applyPromo = useCartStore((s) => s.applyPromo);
  const removePromo = useCartStore((s) => s.removePromo);

  const shipping = subtotal >= 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  // Use cart store promo (applied from CartDrawer) or local state
  const activePromoCode = cart?.promoCode || promoApplied;
  const promoDiscount = cart?.promoDiscount || 0;
  const total = subtotal + shipping + tax - promoDiscount;

  const updateAddress = (field) => (e) => setAddress(a => ({ ...a, [field]: e.target.value }));

  const handlePromo = async (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const result = await applyPromo(promoInput.trim());
    if (result.success) {
      setPromoApplied(promoInput.toUpperCase());
      setPromoInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      // 1. Create order
      const orderItems = cart.items.map(item => ({
        product: item.product._id || item.product,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const { data: orderData } = await api.post('/orders', {
        items: orderItems,
        shippingAddress: address,
        promoCode: activePromoCode,
      });

      // 2. Create payment intent
      const { data: piData } = await api.post('/stripe/create-payment-intent', {
        amount: total,
        orderId: orderData.order._id,
      });

      // 3. Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(piData.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: `${address.firstName} ${address.lastName}`, email: user.email },
        },
      });

      if (error) throw new Error(error.message);

      toast.success('Order placed successfully!');
      await clearCart();
      router.push(`/account/orders/${orderData.order._id}?success=true`);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid lg:grid-cols-[1fr_420px] gap-12">
        {/* Left: Steps */}
        <div>
          {/* Step indicator */}
          <div className="flex items-center gap-4 mb-10">
            {[{ n: 1, label: 'Shipping' }, { n: 2, label: 'Payment' }].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step >= n ? 'bg-brand-black text-white' : 'bg-gray-200 text-gray-400'
                }`}>{n}</div>
                <span className={`text-xs tracking-widest uppercase ${step >= n ? 'text-brand-black' : 'text-brand-warm-gray'}`}>{label}</span>
                {n < 2 && <div className="w-12 h-px bg-gray-200" />}
              </div>
            ))}
          </div>

          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-light mb-6">Shipping Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">First Name *</label>
                  <input value={address.firstName} onChange={updateAddress('firstName')} className="input-luxury" required autoComplete="given-name" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">Last Name *</label>
                  <input value={address.lastName} onChange={updateAddress('lastName')} className="input-luxury" required autoComplete="family-name" />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">Street Address *</label>
                <input value={address.street} onChange={updateAddress('street')} className="input-luxury" required autoComplete="street-address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">City *</label>
                  <input value={address.city} onChange={updateAddress('city')} className="input-luxury" required autoComplete="address-level2" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">State *</label>
                  <input value={address.state} onChange={updateAddress('state')} className="input-luxury" required autoComplete="address-level1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">ZIP Code *</label>
                  <input value={address.zipCode} onChange={updateAddress('zipCode')} className="input-luxury" required autoComplete="postal-code" />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase mb-2">Country *</label>
                  <select value={address.country} onChange={updateAddress('country')} className="input-luxury cursor-pointer" required>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="FR">France</option>
                    <option value="DE">Germany</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2">
                  WhatsApp / Phone <span className="text-red-400">*</span>
                </label>
                <input
                  value={address.phone}
                  onChange={updateAddress('phone')}
                  type="tel"
                  placeholder="07xxxxxxxxx"
                  required
                  className="input-luxury"
                  autoComplete="tel"
                  dir="ltr"
                />
                <p className="text-xs text-brand-warm-gray mt-1">
                  {`سيتم التواصل معك على هذا الرقم / We'll contact you on this number`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!address.firstName || !address.lastName || !address.street || !address.city || !address.state || !address.zipCode || !address.phone) {
                    toast.error('Please fill all required fields including phone number');
                    return;
                  }
                  setStep(2);
                }}
                className="btn-primary w-full mt-4"
              >
                Continue to Payment →
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setStep(1)} className="text-brand-warm-gray hover:text-brand-black text-sm">← Back</button>
                <h2 className="font-display text-2xl font-light">Payment</h2>
              </div>

              {/* Shipping summary */}
              <div className="bg-gray-50 border border-brand-black/10 p-4 text-sm">
                <p className="text-xs tracking-widest uppercase text-brand-warm-gray mb-2">Shipping to</p>
                <p>{address.firstName} {address.lastName}</p>
                <p className="text-brand-warm-gray">{address.street}, {address.city}, {address.state} {address.zipCode}</p>
              </div>

              {/* Card element */}
              <div>
                <label className="block text-xs tracking-widest uppercase mb-3">Card Details</label>
                <div className="border border-brand-black/20 px-4 py-4 focus-within:border-brand-gold transition-colors">
                  <CardElement options={CARD_STYLE} />
                </div>
                <p className="text-xs text-brand-warm-gray mt-2 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" /></svg>
                  Secured by Stripe. We never store your card details.
                </p>
              </div>

              <button type="submit" disabled={loading || !stripe} className="btn-primary w-full text-center">
                {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
              </button>

              <p className="text-xs text-brand-warm-gray text-center">
                Test card: 4242 4242 4242 4242 · Any future date · Any CVC
              </p>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div>
          <div className="bg-white border border-brand-black/10 p-6 sticky top-24">
            <h2 className="font-display text-xl font-light mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {cart?.items?.map((item) => (
                <div key={item._id} className="flex gap-3">
                  <div className="relative w-16 h-20 bg-gray-50 flex-shrink-0">
                    {item.product?.images?.[0]?.url && (
                      <Image src={item.product.images[0].url} alt={item.name} fill className="object-cover" sizes="64px" />
                    )}
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-brand-black text-white text-xs rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                    <p className="text-xs text-brand-warm-gray">{item.size} · {item.color}</p>
                    <p className="text-sm mt-1">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo code */}
            {activePromoCode ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2 mb-6">
                <p className="text-xs text-green-700 flex items-center gap-1.5">
                  ✓ Coupon <strong>{activePromoCode}</strong> applied — saving ${promoDiscount.toFixed(2)}
                </p>
                <button onClick={removePromo} className="text-xs text-green-600 hover:text-red-500">Remove</button>
              </div>
            ) : (
              <form onSubmit={handlePromo} className="flex gap-2 mb-6">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Coupon / promo code"
                  className="input-luxury flex-1 text-xs py-2"
                  dir="ltr"
                />
                <button
                  type="submit"
                  className="px-4 py-2 border border-brand-black text-xs tracking-widest uppercase hover:bg-brand-black hover:text-white transition-colors"
                >
                  Apply
                </button>
              </form>
            )}

            {/* Totals */}
            <div className="space-y-2 text-sm border-t border-brand-black/10 pt-4">
              <div className="flex justify-between text-brand-warm-gray">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-brand-warm-gray">
                <span>Shipping</span><span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-brand-warm-gray">
                <span>Tax (8%)</span><span>${tax.toFixed(2)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span><span>−${promoDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-brand-black pt-3 border-t border-brand-black/10">
                <span className="text-xs tracking-widest uppercase">Total</span>
                <span className="text-lg">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCartStore((s) => s.cart);
  const guestItems = useCartStore((s) => s.guestItems);
  const subtotal = useCartStore((s) => s.subtotal());
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    // If not logged in, redirect to guest checkout
    if (!user) {
      router.replace('/guest-checkout');
    }
  }, [user]);

  const hasItems = cart?.items?.length > 0;

  if (!user) return null; // redirecting

  if (!hasItems) {
    return (
      <Layout>
        <div className="container-luxury py-24 text-center">
          <h1 className="font-display text-4xl mb-4">Your bag is empty</h1>
          <Link href="/products" className="btn-primary">Shop Collection</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <NextSeo title="Checkout" />
      <div className="container-luxury py-12">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="font-display text-2xl tracking-[0.15em] text-brand-black">YF14 Store</Link>
          <span className="text-brand-warm-gray">/</span>
          <span className="text-xs tracking-widest uppercase text-brand-warm-gray">Checkout</span>
        </div>
        <Elements stripe={stripePromise}>
          <CheckoutForm cart={cart} subtotal={subtotal} />
        </Elements>
      </div>
    </Layout>
  );
}
