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
import { DELIVERY_FEE_IQD } from '../lib/deliveryFee';
import { resolveCartLineDisplay } from '../lib/cartLineDisplay';
import { IMAGE_BLUR_DATA_URL, optimizeRemoteImageSrc } from '../lib/remoteImage';

const BG = '#0f1117';
const CARD = '#1a1d2e';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT = '#e8e8f0';
const MUTED = '#6b7280';
const MUTED2 = '#9ca3af';
const PURPLE = '#8b5cf6';
const PURPLE_LIGHT = '#a78bfa';
const PURPLE_BG = 'rgba(139,92,246,0.12)';
const PURPLE_BORDER = 'rgba(139,92,246,0.25)';
const GREEN = '#22c55e';
const GREEN_BG = 'rgba(34,197,94,0.13)';
const RED = '#ef4444';

const IRAQI_PROVINCES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'السليمانية', 'كركوك',
  'النجف', 'كربلاء', 'الأنبار', 'ديالى', 'واسط', 'ذي قار',
  'ميسان', 'المثنى', 'القادسية', 'صلاح الدين', 'بابل', 'دهوك',
];

const inputClass =
  'w-full min-h-[44px] px-[15px] py-3 rounded-[10px] text-base sm:text-sm outline-none transition-all duration-200 border-[1.5px] bg-white/[0.05] text-[#e8e8f0] placeholder:text-[#6b7280] focus:border-[#8b5cf6] focus:bg-[rgba(139,92,246,0.08)] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] touch-manipulation';

const labelClass = 'text-[11px] tracking-[0.08em] text-[#9ca3af] mb-1.5 flex items-center gap-1';

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

  const copy = {
    pageTitle: isRTL ? 'إتمام الطلب' : 'Checkout',
    pageSub: isRTL ? 'يرجى القراءة بعناية قبل إتمام الطلب' : 'Please read carefully before completing your order',
    stepCart: isRTL ? 'السلة' : 'Bag',
    stepDetails: isRTL ? 'التفاصيل' : 'Details',
    stepConfirm: isRTL ? 'التأكيد' : 'Confirm',
    contactTitle: isRTL ? 'معلومات التواصل' : 'Contact',
    phoneLabel: isRTL ? 'رقم الهاتف' : 'Phone',
    phonePh: '07xxxxxxxxx / 7xxxxxxxxx',
    emailNote: isRTL
      ? 'سيتم إرسال تفاصيل طلبك ورقم التتبع على هذا البريد'
      : 'Order details and tracking will be sent to this email',
    addressTitle: isRTL ? 'عنوان التوصيل' : 'Delivery address',
    province: isRTL ? 'المحافظة' : 'Province',
    provincePh: isRTL ? '-- اختاري المحافظة --' : '-- Select province --',
    area: isRTL ? 'المنطقة / الحي' : 'Area / neighborhood',
    areaPh: isRTL ? 'مثال: الكرادة، المنصور' : 'e.g. Karrada, Mansour',
    notes: isRTL ? 'ملاحظات للمندوب' : 'Notes for courier',
    notesPh: isRTL ? 'أي تفاصيل تسهّل التوصيل...' : 'Anything that helps delivery…',
    optional: isRTL ? '(اختياري)' : '(optional)',
    summaryTitle: isRTL ? 'ملخص الطلب' : 'Order summary',
    labelColor: isRTL ? 'اللون' : 'Color',
    labelSize: isRTL ? 'المقاس' : 'Size',
    promoPh: isRTL ? 'كود الخصم' : 'Promo code',
    apply: isRTL ? 'تطبيق' : 'Apply',
    subtotal: isRTL ? 'المجموع الفرعي' : 'Subtotal',
    delivery: isRTL ? 'التوصيل' : 'Delivery',
    discountRow: isRTL ? 'خصم الكوبون' : 'Coupon discount',
    total: isRTL ? 'الإجمالي' : 'Total',
    placeOrder: isRTL ? 'تأكيد الطلب' : 'Place order',
    secure: isRTL ? 'طلبك آمن ومحمي' : 'Your order is secure',
    warnColorSize: isRTL
      ? 'تأكدي من اللون والمقاس قبل إتمام الطلب.'
      : 'Please confirm the color and size before completing your order.',
    codTitle: isRTL ? 'الدفع عند الاستلام' : 'Cash on delivery',
    codBody: isRTL
      ? `رسوم التوصيل ${formatIQD(DELIVERY_FEE_IQD)} تُدفع للمندوب عند الاستلام – لجميع محافظات العراق. الإجمالي أعلاه يشملها.`
      : `Delivery fee ${formatIQD(DELIVERY_FEE_IQD)} is paid to the driver on delivery — all Iraqi governorates. The total above includes it.`,
    returnTitle: isRTL ? 'سياسة الإرجاع' : 'Return policy',
    returnBody: isRTL ? (
      <>
        الإرجاع مقبول <strong className="text-amber-950">فقط أمام المندوب</strong> وقبل استلام الطلب. يرجى{' '}
        <strong className="text-amber-950">فحص المنتج جيداً</strong> قبل أخذه من المندوب.
        <br />
        <span className="text-red-600 font-semibold">لا نتحمل أي مسؤولية بعد مغادرة المندوب.</span>
      </>
    ) : (
      <>
        Returns are accepted <strong className="text-amber-950">only in front of the courier</strong> before you accept the order. Please{' '}
        <strong className="text-amber-950">inspect the item carefully</strong> before taking it from the courier.
        <br />
        <span className="text-red-600 font-semibold">We are not responsible after the courier leaves.</span>
      </>
    ),
    successTitle: isRTL ? 'تم تأكيد طلبك!' : 'Order confirmed!',
    successThanks: isRTL ? `شكراً لثقتك بـ ${t.siteName}` : `Thank you for shopping with ${t.siteName}`,
    successBody: isRTL
      ? 'سيتواصل معك فريقنا قريباً لتأكيد الطلب وتحديد موعد التوصيل.'
      : 'Our team will contact you soon to confirm and schedule delivery.',
    orderNumShortLabel: isRTL ? 'رقم طلبك' : 'Your order number',
    orderTrackHint: isRTL ? 'احتفظ بهذا الرقم لتتبع طلبك' : 'Keep this number to track your order',
    stepReceived: isRTL ? 'تم استلام الطلب' : 'Order received',
    stepPrep: isRTL ? 'جاري التجهيز' : 'Preparing',
    stepShip: isRTL ? 'في الطريق إليك' : 'On the way',
    continue: isRTL ? 'متابعة التسوق' : 'Continue shopping',
    myOrders: isRTL ? 'طلباتي' : 'My orders',
    empty: isRTL ? 'السلة فارغة' : 'Your bag is empty',
    shop: isRTL ? 'تسوقي الآن' : 'Shop now',
  };

  useEffect(() => {
    if (!user) router.replace('/guest-checkout');
  }, [user]);

  useEffect(() => {
    if (user?.id) useCartStore.getState().fetchCart();
  }, [user?.id]);

  const total = subtotal - discount + DELIVERY_FEE_IQD;
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handlePromo = async (e) => {
    e?.preventDefault?.();
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
    if (!form.phone.trim()) {
      toast.error(isRTL ? 'يرجى إدخال رقم الهاتف' : 'Phone is required');
      return;
    }
    if (!validPhone) {
      toast.error(isRTL ? 'رقم الهاتف غير صحيح — يجب أن يكون 07xxxxxxxxx أو 7xxxxxxxxx' : 'Invalid phone — must be 07xxxxxxxxx or 7xxxxxxxxx');
      return;
    }
    if (!form.city) {
      toast.error(isRTL ? 'يرجى اختيار المحافظة' : 'Province is required');
      return;
    }
    if (!form.town.trim()) {
      toast.error(isRTL ? 'يرجى إدخال المنطقة / الحي' : 'Area is required');
      return;
    }

    setLoading(true);
    try {
      const orderItems = cart.items.map((item) => ({
        product: item.product._id || item.product,
        variantId: item.variantId,
        quantity: item.quantity,
        ...(item.customerHeightCm != null ? { customerHeightCm: item.customerHeightCm } : {}),
        ...(item.customerWeightKg != null ? { customerWeightKg: item.customerWeightKg } : {}),
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
    const orderRaw = String(orderNumber || '')
      .trim()
      .replace(/^#+/, '')
      .replace(/#+$/, '');
    const orderDisplay = orderRaw ? `#${orderRaw}` : '#';

    const StepLine = ({ done: active }) => (
      <div className="flex-1 min-w-[12px] pt-[22px] px-0.5">
        <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: active ? GREEN : 'rgba(255,255,255,0.12)' }} />
      </div>
    );

    const StepCircle = ({ state, children, label }) => {
      const isDone = state === 'done';
      const isCurrent = state === 'current';
      let circleStyle;
      if (isDone) {
        circleStyle = {
          backgroundColor: 'rgba(34,197,94,0.2)',
          borderColor: GREEN,
          boxShadow: '0 0 20px rgba(34,197,94,0.35)',
        };
      } else if (isCurrent) {
        circleStyle = {
          backgroundColor: 'rgba(139,92,246,0.22)',
          borderColor: PURPLE_LIGHT,
          boxShadow: '0 0 18px rgba(139,92,246,0.35)',
        };
      } else {
        circleStyle = {
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.12)',
        };
      }
      const labelColor = isDone ? '#86efac' : isCurrent ? PURPLE_LIGHT : MUTED2;
      return (
        <div className="flex flex-col items-center w-[4.5rem] sm:w-[5.25rem] shrink-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 transition-shadow" style={circleStyle}>
            {children}
          </div>
          <p className="text-[10px] sm:text-[11px] mt-2.5 text-center leading-tight px-0.5" style={{ color: labelColor }}>
            {label}
          </p>
        </div>
      );
    };

    return (
      <Layout>
        <NextSeo title={isRTL ? 'تم الطلب' : 'Order placed'} />
        <div
          className="min-h-screen flex flex-col items-center px-5 sm:px-6 pt-20 sm:pt-28 pb-16"
          style={{ backgroundColor: BG, color: TEXT }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="w-full max-w-[420px] mx-auto text-center animate-fade-up">
            <div
              className="w-[5.25rem] h-[5.25rem] rounded-full flex items-center justify-center mx-auto mb-3 border-2"
              style={{
                backgroundColor: GREEN_BG,
                borderColor: 'rgba(34,197,94,0.55)',
                boxShadow: '0 0 36px rgba(34,197,94,0.4)',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-2xl block mb-2" aria-hidden>
              🎉
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-body mb-4 leading-tight">{copy.successTitle}</h1>
            <p className="text-sm leading-relaxed mb-1" style={{ color: MUTED2 }}>
              {copy.successThanks}
            </p>
            <p className="text-sm leading-relaxed mb-8" style={{ color: MUTED2 }}>
              {copy.successBody}
            </p>

            <div
              className="rounded-2xl border px-6 py-6 mb-10 text-center"
              style={{ backgroundColor: CARD, borderColor: BORDER, boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: MUTED }}>
                {copy.orderNumShortLabel}
              </p>
              <p className="text-2xl sm:text-[1.65rem] font-bold font-mono mb-3 break-all" style={{ color: PURPLE_LIGHT }}>
                {orderDisplay}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: MUTED2 }}>
                {copy.orderTrackHint}
              </p>
            </div>

            <div className="mb-10 w-full" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="flex items-start justify-between w-full max-w-[380px] mx-auto">
                <StepCircle state="done" label={copy.stepReceived}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </StepCircle>
                <StepLine done />
                <StepCircle state="current" label={copy.stepPrep}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE_LIGHT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </StepCircle>
                <StepLine done={false} />
                <StepCircle state="pending" label={copy.stepShip}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
                    <path d="M16 8h4l3 3v5h-7V8z" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </StepCircle>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/products"
                className="flex w-full items-center justify-center py-4 rounded-2xl text-white font-semibold text-[15px] transition-all hover:brightness-110 active:scale-[0.99]"
                style={{ backgroundColor: PURPLE, boxShadow: '0 10px 32px rgba(139,92,246,0.4)' }}
              >
                {copy.continue}
              </Link>
              <Link
                href="/account/orders"
                className="flex w-full items-center justify-center py-4 rounded-2xl border font-semibold text-[15px] transition-colors hover:bg-white/[0.06]"
                style={{ borderColor: PURPLE_LIGHT, color: PURPLE_LIGHT }}
              >
                {copy.myOrders}
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
        <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: BG, color: TEXT }}>
          <h1 className="text-2xl font-bold font-body mb-4">{copy.empty}</h1>
          <Link href="/products" className="px-8 py-3 rounded-xl text-white font-semibold" style={{ backgroundColor: PURPLE }}>
            {copy.shop}
          </Link>
        </div>
      </Layout>
    );
  }

  const CardIconUser = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={PURPLE_LIGHT} strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
  const CardIconPin = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={PURPLE_LIGHT} strokeWidth="2" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );

  return (
    <Layout>
      <NextSeo title={copy.pageTitle} />
      <div
        className="min-h-full w-full pb-[max(4rem,env(safe-area-inset-bottom,0px)+1rem)] sm:pb-20"
        style={{ backgroundColor: BG, color: TEXT }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-[1020px] mx-auto px-3 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="text-center pt-10 sm:pt-11 pb-5">
            <nav className="flex flex-wrap items-center justify-center gap-1.5 text-xs sm:text-sm mb-4" style={{ color: MUTED }} aria-label="Breadcrumb">
              <Link href="/" className="hover:opacity-80 transition-opacity" style={{ color: MUTED }}>
                {t.siteName}
              </Link>
              <span aria-hidden>/</span>
              <span style={{ color: MUTED2 }}>{copy.pageTitle}</span>
            </nav>
            <h1 className="text-[clamp(1.75rem,4.5vw,2.5rem)] font-bold font-body mb-1.5">{copy.pageTitle}</h1>
            <p className="text-sm" style={{ color: MUTED2 }}>
              {copy.pageSub}
            </p>
          </header>

          {/* Steps */}
          <div className="flex items-end justify-center max-w-[400px] mx-auto mb-8 px-4 gap-1">
            {[
              { key: '1', label: copy.stepCart, done: true },
              { key: '2', label: copy.stepDetails, active: true },
              { key: '3', label: copy.stepConfirm, done: false },
            ].map((step, i, arr) => (
              <div key={step.key} className="contents">
                <div className="flex flex-col items-center gap-1.5 w-[72px] shrink-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold border"
                    style={
                      step.done
                        ? { backgroundColor: GREEN, borderColor: GREEN, color: '#fff' }
                        : step.active
                          ? { backgroundColor: PURPLE, borderColor: PURPLE, color: '#fff' }
                          : { backgroundColor: CARD, borderColor: BORDER, color: MUTED2 }
                    }
                  >
                    {step.done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      step.key
                    )}
                  </div>
                  <span
                    className="text-[11px] text-center leading-tight px-0.5"
                    style={{ color: step.done ? GREEN : step.active ? PURPLE_LIGHT : MUTED }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div
                    className="flex-1 h-px mb-6 min-w-[12px] mx-0.5"
                    style={{ backgroundColor: i === 0 ? PURPLE : BORDER }}
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-5 items-start">
              {/* Left column */}
              <div className="space-y-3.5">
                {/* Contact */}
                <div className="rounded-2xl border p-5 sm:p-7" style={{ backgroundColor: CARD, borderColor: BORDER }}>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: PURPLE_BG }}>
                      {CardIconUser}
                    </div>
                    <h2 className="text-[15px] font-bold">{copy.contactTitle}</h2>
                  </div>

                  <div className="rounded-xl border px-3 py-2.5 mb-4 text-sm" style={{ borderColor: BORDER, backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <p className="font-semibold">
                      {user.firstName} {user.lastName}
                    </p>
                    {user.email && <p className="text-xs mt-0.5" style={{ color: MUTED2 }}>{user.email}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>
                      {copy.phoneLabel} <span style={{ color: RED }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      required
                      placeholder={copy.phonePh}
                      dir="ltr"
                      className={inputClass}
                      style={{ borderColor: BORDER }}
                    />
                    <p className="text-[11px] mt-1.5" style={{ color: MUTED }}>
                      {isRTL ? 'سيتم التواصل معك على هذا الرقم' : "We'll contact you on this number"}
                    </p>
                  </div>

                  {user.email && (
                    <>
                      <label className={`${labelClass} mt-4`}>
                        {isRTL ? 'البريد الإلكتروني' : 'Email'}{' '}
                        <span className="text-[10px]" style={{ color: MUTED }}>
                          {copy.optional}
                        </span>
                      </label>
                      <input type="email" readOnly value={user.email} dir="ltr" className={`${inputClass} opacity-90`} style={{ borderColor: BORDER }} />
                      <div
                        className="mt-2 px-3 py-2 rounded-lg text-xs flex items-start gap-2 border"
                        style={{ backgroundColor: PURPLE_BG, borderColor: PURPLE_BORDER, color: MUTED2 }}
                      >
                        <span style={{ color: PURPLE_LIGHT }} aria-hidden>
                          ℹ️
                        </span>
                        <span>{copy.emailNote}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Address */}
                <div className="rounded-2xl border p-5 sm:p-7" style={{ backgroundColor: CARD, borderColor: BORDER }}>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: PURPLE_BG }}>
                      {CardIconPin}
                    </div>
                    <h2 className="text-[15px] font-bold">{copy.addressTitle}</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
                    <div>
                      <label className={labelClass}>
                        {copy.province} <span style={{ color: RED }}>*</span>
                      </label>
                      <select
                        value={form.city}
                        onChange={update('city')}
                        required
                        className={`${inputClass} select-iq-provinces-dark`}
                        style={{
                          borderColor: BORDER,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: TEXT,
                        }}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        <option value="">{copy.provincePh}</option>
                        {IRAQI_PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>
                        {copy.area} <span style={{ color: RED }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={form.town}
                        onChange={update('town')}
                        required
                        placeholder={copy.areaPh}
                        className={inputClass}
                        style={{ borderColor: BORDER }}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      {copy.notes}{' '}
                      <span className="text-[10px]" style={{ color: MUTED }}>
                        {copy.optional}
                      </span>
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={update('notes')}
                      rows={2}
                      placeholder={copy.notesPh}
                      className={`${inputClass} resize-none min-h-[72px]`}
                      style={{ borderColor: BORDER }}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>
              </div>

              {/* Right column — sticky */}
              <div className="lg:sticky lg:top-24 space-y-3.5">
                {/* Cream info panel — color/size + COD + return (same vibe) */}
                <div
                  className="rounded-[22px] border px-4 py-4 sm:px-6 sm:py-5"
                  style={{
                    backgroundColor: '#fffbeb',
                    borderColor: 'rgba(234, 179, 8, 0.35)',
                    color: '#44403c',
                  }}
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  <div className="flex gap-3 items-start pb-3.5 border-b border-amber-200/80">
                    <span className="text-xl shrink-0 leading-none mt-0.5" aria-hidden>
                      ⚠️
                    </span>
                    <p className="text-sm font-bold text-amber-950 leading-relaxed flex-1 min-w-0">
                      {copy.warnColorSize}
                    </p>
                  </div>

                  <div className="flex gap-3 items-start pt-3.5 pb-3.5 border-b border-amber-200/80">
                    <span className="text-xl shrink-0 leading-none mt-0.5" aria-hidden>
                      🚚
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-amber-950">{copy.codTitle}</p>
                      <p className="text-xs mt-1 leading-[1.85] text-amber-900/90">
                        {isRTL ? (
                          <>
                            رسوم التوصيل <strong className="text-amber-950">{formatIQD(DELIVERY_FEE_IQD)}</strong> تُدفع للمندوب عند الاستلام – لجميع محافظات العراق. الإجمالي أعلاه يشملها.
                          </>
                        ) : (
                          <>
                            Delivery fee <strong className="text-amber-950">{formatIQD(DELIVERY_FEE_IQD)}</strong> is paid to the driver on delivery — all Iraqi governorates. The total above includes it.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start pt-3.5">
                    <span className="text-xl shrink-0 leading-none mt-0.5" aria-hidden>
                      ⚠️
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-amber-950">{copy.returnTitle}</p>
                      <p className="text-xs mt-1 leading-[1.85] text-amber-900/90">{copy.returnBody}</p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-2xl border p-5 sm:p-7" style={{ backgroundColor: CARD, borderColor: BORDER }}>
                  <h2 className="text-[15px] font-bold mb-4">{copy.summaryTitle}</h2>

                  <div className="flex flex-col gap-3.5 mb-5">
                    {cart?.items?.map((item) => {
                      const line = resolveCartLineDisplay(item);
                      return (
                      <div
                        key={item._id}
                        className="flex items-center gap-3 pb-3.5 border-b last:border-b-0 last:pb-0"
                        style={{ borderColor: BORDER }}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        <div
                          className="w-[54px] h-[66px] rounded-[10px] overflow-hidden shrink-0 relative bg-gradient-to-br from-[#2e1f45] to-[#1a1530]"
                        >
                          {line.imageUrl ? (
                            <Image
                              src={optimizeRemoteImageSrc(line.imageUrl, { maxWidth: 180, quality: 75 })}
                              alt={line.name}
                              fill
                              className="object-cover"
                              sizes="54px"
                              loading="lazy"
                              placeholder="blur"
                              blurDataURL={IMAGE_BLUR_DATA_URL}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M20 20 Q12 10 4 20 L6 6 Q12 2 18 6 Z" />
                              </svg>
                            </div>
                          )}
                          <span
                            className="absolute -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: PURPLE, [isRTL ? 'left' : 'right']: '-6px' }}
                          >
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold leading-snug line-clamp-2">{line.name}</p>
                          <div className="mt-1.5 flex flex-col gap-1 text-[11px] sm:text-xs" style={{ color: MUTED2 }}>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-[10px] uppercase tracking-wider shrink-0" style={{ color: MUTED }}>
                                {copy.labelColor}
                              </span>
                              <span className="inline-flex items-center gap-1.5 min-w-0 font-medium" style={{ color: TEXT }}>
                                {line.colorCode ? (
                                  <>
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border shrink-0 border-white/20"
                                      style={{ backgroundColor: line.colorCode }}
                                      title={line.color}
                                      aria-hidden
                                    />
                                    <span className="truncate">{line.color || '—'}</span>
                                  </>
                                ) : (
                                  <span>{line.color || '—'}</span>
                                )}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-[10px] uppercase tracking-wider shrink-0" style={{ color: MUTED }}>
                                {copy.labelSize}
                              </span>
                              <span className="font-semibold" style={{ color: TEXT }}>
                                {line.size || '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-bold whitespace-nowrap shrink-0">{formatIQD(item.price * item.quantity)}</div>
                      </div>
                      );
                    })}
                  </div>

                  {promoCode ? (
                    <div
                      className="flex items-center justify-between rounded-lg border px-3 py-2 mb-5 text-xs"
                      style={{ borderColor: 'rgba(34,197,94,0.35)', backgroundColor: 'rgba(34,197,94,0.1)', color: GREEN }}
                    >
                      <span>
                        ✓ {isRTL ? 'كوبون' : 'Coupon'} <strong>{promoCode}</strong> — {formatIQD(discount)}
                      </span>
                      <button type="button" onClick={removePromo} className="text-red-400 hover:text-red-300 font-medium">
                        {isRTL ? 'إزالة' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mb-5">
                      <input
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder={copy.promoPh}
                        className="flex-1 rounded-[10px] border px-3.5 py-2.5 text-sm outline-none transition-all bg-white/[0.05] text-inherit placeholder:text-[#6b7280] focus:border-[#8b5cf6] focus:bg-[rgba(139,92,246,0.08)]"
                        style={{ borderColor: BORDER }}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                      <button
                        type="button"
                        onClick={(e) => handlePromo(e)}
                        className="shrink-0 rounded-[10px] border px-4 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[rgba(139,92,246,0.25)]"
                        style={{ borderColor: PURPLE_BORDER, backgroundColor: 'rgba(139,92,246,0.15)', color: PURPLE_LIGHT }}
                      >
                        {copy.apply}
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5 text-sm mb-5" style={{ color: MUTED2 }}>
                    <div className="flex justify-between">
                      <span>{copy.subtotal}</span>
                      <span>{formatIQD(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{copy.delivery}</span>
                      <span className="font-medium" style={{ color: TEXT }}>
                        {formatIQD(DELIVERY_FEE_IQD)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between font-medium" style={{ color: GREEN }}>
                        <span>
                          {copy.discountRow} ({promoCode})
                        </span>
                        <span>−{formatIQD(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3.5 border-t text-[17px] font-bold" style={{ borderColor: BORDER, color: TEXT }}>
                      <span>{copy.total}</span>
                      <span>{formatIQD(total)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl text-white text-base font-bold transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: PURPLE, boxShadow: '0 8px 28px rgba(139,92,246,0.35)' }}
                  >
                    {loading ? (isRTL ? 'جاري المعالجة...' : 'Processing…') : isRTL ? `← ${copy.placeOrder}` : `${copy.placeOrder} →`}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 mt-2.5 text-xs" style={{ color: MUTED }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    {copy.secure}
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
