import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { NextSeo } from 'next-seo';
import Layout from '../components/layout/Layout';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { useLang } from '../contexts/LanguageContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { formatIQD } from '../lib/currency';

const IRAQI_PROVINCES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'السليمانية', 'كركوك',
  'النجف', 'كربلاء', 'الأنبار', 'ديالى', 'واسط', 'ذي قار',
  'ميسان', 'المثنى', 'القادسية', 'صلاح الدين', 'بابل', 'دهوك',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { t, isRTL } = useLang();
  const user = useAuthStore((s) => s.user);
  const cart = useCartStore((s) => s.cart);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const { activePromoCode, activePromoDiscount } = useCartStore();

  const promoCode = typeof activePromoCode === 'function' ? activePromoCode() : activePromoCode;
  const discount = typeof activePromoDiscount === 'function' ? activePromoDiscount() : (activePromoDiscount || 0);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [promoInput, setPromoInput] = useState('');

  const applyPromo = useCartStore((s) => s.applyPromo);
  const removePromo = useCartStore((s) => s.removePromo);

  const [form, setForm] = useState({
    phone: '',
    city: '',
    town: '',
    notes: '',
  });

  useEffect(() => {
    if (!user) router.replace('/guest-checkout');
  }, [user]);

  const total = subtotal - discount;
  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handlePromo = async (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const result = await applyPromo(promoInput.trim());
    if (result.success) {
      setPromoInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneClean = form.phone.trim().replace(/\s|-/g, '');
    const validPhone = /^(07\d{9}|7\d{9})$/.test(phoneClean);
    if (!form.phone.trim()) { toast.error(isRTL ? 'يرجى إدخال رقم الهاتف' : 'Phone is required'); return; }
    if (!validPhone) { toast.error(isRTL ? 'رقم الهاتف غير صحيح — يجب أن يكون 07xxxxxxxxx أو 7xxxxxxxxx' : 'Invalid phone — must be 07xxxxxxxxx or 7xxxxxxxxx'); return; }
    if (!form.city) { toast.error(isRTL ? 'يرجى اختيار المحافظة' : 'Province is required'); return; }
    if (!form.town.trim()) { toast.error(isRTL ? 'يرجى إدخال المنطقة / الحي' : 'Area is required'); return; }

    setLoading(true);
    try {
      const orderItems = cart.items.map(item => ({
        product: item.product._id || item.product,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const { data } = await api.post('/orders', {
        items: orderItems,
        shippingAddress: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          city: form.city,
          state: form.town.trim(),
          phone: form.phone.trim(),
          country: 'IQ',
        },
        promoCode: promoCode || undefined,
        paymentMethod: 'cash',
      });

      await clearCart();
      setOrderNumber(data.order.orderNumber || data.orderNumber);
      setDone(true);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || (isRTL ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'Something went wrong');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (done) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-3xl mb-3 text-brand-black">
              {isRTL ? 'تم استلام طلبك!' : 'Order Received!'}
            </h1>
            <p className="text-brand-warm-gray mb-2">
              {isRTL ? 'رقم طلبك:' : 'Your order number:'}
            </p>
            <p className="font-mono text-xl font-bold text-brand-gold mb-6">{orderNumber}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-sm text-amber-800 text-right" dir="rtl">
              <p className="font-medium mb-1">📦 ماذا يحدث الآن؟</p>
              <p>سيراجع فريقنا طلبك وسيتواصل معك خلال فترة قصيرة للتأكيد.</p>
              {user.email && <p className="mt-1">سيصلك إيميل تأكيد على {user.email}</p>}
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/products" className="btn-primary">
                {isRTL ? 'مواصلة التسوق' : 'Continue Shopping'}
              </Link>
              <Link href="/account/orders" className="border border-brand-black px-6 py-3 text-xs tracking-widest uppercase hover:bg-brand-black hover:text-white transition-colors">
                {isRTL ? 'طلباتي' : 'My Orders'}
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const hasItems = cart?.items?.length > 0;

  if (!hasItems) {
    return (
      <Layout>
        <div className="container-luxury py-24 text-center">
          <h1 className="font-display text-4xl mb-4">
            {isRTL ? 'السلة فارغة' : 'Your bag is empty'}
          </h1>
          <Link href="/products" className="btn-primary">
            {isRTL ? 'تسوقي الآن' : 'Shop Collection'}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <NextSeo title={isRTL ? 'إتمام الطلب' : 'Checkout'} />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="font-display text-2xl tracking-widest text-brand-black">YF14</Link>
            <span className="text-brand-warm-gray">/</span>
            <span className="text-sm text-brand-warm-gray uppercase tracking-wider">
              {isRTL ? 'إتمام الطلب' : 'Checkout'}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* Left — Form */}
              <div className="lg:col-span-3 space-y-5">

                {/* Logged-in notice */}
                <div className="bg-white rounded-xl border border-brand-black/10 p-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                    {(user.firstName?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div dir={isRTL ? 'rtl' : 'ltr'}>
                    <p className="text-sm font-medium text-brand-black">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-brand-warm-gray">{user.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-white rounded-xl border border-brand-black/10 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
                  <h2 className="font-display text-lg mb-5 text-brand-black">
                    {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                  </h2>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-brand-warm-gray mb-1.5">
                      {isRTL ? 'رقم الهاتف / واتساب *' : 'Phone / WhatsApp *'}
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      required
                      placeholder="07xxxxxxxxx / 7xxxxxxxxx"
                      className="w-full border border-brand-black/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                      dir="ltr"
                    />
                    <p className="text-xs text-brand-warm-gray mt-1">
                      {isRTL ? 'سيتم التواصل معك على هذا الرقم' : "We'll contact you on this number"}
                    </p>
                  </div>
                </div>

                {/* Delivery address */}
                <div className="bg-white rounded-xl border border-brand-black/10 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
                  <h2 className="font-display text-lg mb-5 text-brand-black">
                    {isRTL ? 'عنوان التوصيل' : 'Delivery Address'}
                  </h2>
                  <div className="space-y-4">

                    {/* Province */}
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-brand-warm-gray mb-1.5">
                        {isRTL ? 'المحافظة *' : 'Province *'}
                      </label>
                      <select
                        value={form.city}
                        onChange={update('city')}
                        required
                        className="w-full border border-brand-black/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors bg-white appearance-none"
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        <option value="">{isRTL ? '-- اختاري المحافظة --' : '-- Select Province --'}</option>
                        {IRAQI_PROVINCES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    {/* Town / Area */}
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-brand-warm-gray mb-1.5">
                        {isRTL ? 'المنطقة / الحي *' : 'Area / Neighborhood *'}
                      </label>
                      <input
                        type="text"
                        value={form.town}
                        onChange={update('town')}
                        required
                        placeholder={isRTL ? 'مثال: الكرادة، المنصور ...' : 'e.g. Karrada, Mansour...'}
                        className="w-full border border-brand-black/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-brand-warm-gray mb-1.5">
                        {isRTL ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
                      </label>
                      <textarea
                        value={form.notes}
                        onChange={update('notes')}
                        rows={2}
                        placeholder={isRTL ? 'أي تفاصيل إضافية للتوصيل...' : 'Any additional delivery details...'}
                        className="w-full border border-brand-black/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery & return policy */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3" dir="rtl">
                  <div className="flex gap-3">
                    <span className="text-xl">🚚</span>
                    <div>
                      <p className="font-medium text-sm text-amber-900">الدفع عند الاستلام</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        رسوم التوصيل <strong>5,000 د.ع</strong> تُدفع للمندوب عند الاستلام — لجميع محافظات العراق.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 border-t border-amber-200 pt-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="font-medium text-sm text-amber-900">سياسة الإرجاع</p>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        الإرجاع مقبول <strong>فقط أمام المندوب</strong> وقبل استلام الطلب.
                        يرجى <strong>فحص المنتج جيداً</strong> قبل أخذه من المندوب.
                        <br />
                        <span className="text-red-600 font-medium">لا نتحمل أي مسؤولية بعد مغادرة المندوب.</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — Order summary */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-brand-black/10 p-6 sticky top-6">
                  <h2 className="font-display text-lg mb-5 text-brand-black" dir={isRTL ? 'rtl' : 'ltr'}>
                    {isRTL ? 'ملخص الطلب' : 'Order Summary'}
                  </h2>

                  {/* Items */}
                  <div className="space-y-4 mb-5">
                    {cart?.items?.map((item) => (
                      <div key={item._id} className="flex gap-3">
                        <div className="w-14 bg-gray-50 rounded overflow-hidden flex-shrink-0 relative" style={{ height: '72px' }}>
                          {item.product?.images?.[0]?.url && (
                            <Image src={item.product.images[0].url} alt={item.name} fill className="object-cover" sizes="56px" />
                          )}
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-black text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0" dir={isRTL ? 'rtl' : 'ltr'}>
                          <p className="text-xs font-medium line-clamp-2 leading-snug">{item.name}</p>
                          <p className="text-xs text-brand-warm-gray mt-0.5">{item.size} · {item.color}</p>
                          <p className="text-sm font-semibold mt-1">{formatIQD(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo code */}
                  {promoCode ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-5">
                      <p className="text-xs text-green-700 flex items-center gap-1.5">
                        ✓ {isRTL ? 'كوبون' : 'Coupon'} <strong>{promoCode}</strong> — {isRTL ? 'خصم' : 'saving'} {formatIQD(discount)}
                      </p>
                      <button type="button" onClick={removePromo} className="text-xs text-green-600 hover:text-red-500">
                        {isRTL ? 'إزالة' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handlePromo} className="flex gap-2 mb-5">
                      <input
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder={isRTL ? 'كود خصم' : 'Promo code'}
                        className="flex-1 border border-brand-black/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-400 transition-colors"
                        dir="ltr"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 border border-brand-black text-xs tracking-widest uppercase hover:bg-brand-black hover:text-white transition-colors rounded-lg"
                      >
                        {isRTL ? 'تطبيق' : 'Apply'}
                      </button>
                    </form>
                  )}

                  {/* Totals */}
                  <div className="space-y-2 text-sm border-t border-brand-black/10 pt-4" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className="flex justify-between text-brand-warm-gray">
                      <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                      <span>{formatIQD(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-brand-warm-gray">
                      <span>{isRTL ? 'التوصيل (تُدفع للمندوب)' : 'Delivery (paid to driver)'}</span>
                      <span className="font-medium text-brand-black">5,000 د.ع</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>{isRTL ? 'خصم' : 'Discount'} ({promoCode})</span>
                        <span>−{formatIQD(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-brand-black pt-3 border-t border-brand-black/10">
                      <span className="text-xs uppercase tracking-wider">{isRTL ? 'الإجمالي' : 'Total'}</span>
                      <span className="text-lg">{formatIQD(total)}</span>
                    </div>
                    <p className="text-xs text-brand-warm-gray pt-1" dir="rtl">
                      * رسوم التوصيل 5,000 د.ع تُضاف عند الاستلام
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 py-4 text-white font-medium rounded-lg text-sm tracking-wider transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #9333ea, #db2777)' }}
                  >
                    {loading
                      ? (isRTL ? 'جاري المعالجة...' : 'Processing...')
                      : (isRTL ? '✅ تأكيد الطلب' : '✅ Place Order')}
                  </button>

                  <p className="text-xs text-center text-brand-warm-gray mt-3" dir="rtl">
                    الدفع عند الاستلام + 5,000 د.ع توصيل — لا حاجة لبطاقة بنكية
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
