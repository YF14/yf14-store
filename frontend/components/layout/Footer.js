import Link from 'next/link';
import { useLang } from '../../contexts/LanguageContext';

export default function Footer() {
  const { t, isRTL } = useLang();

  const collections = [
    { label: t.nav.evening, href: '/products?category=evening-dresses' },
    { label: t.nav.cocktail, href: '/products?category=cocktail-dresses' },
    { label: t.nav.maxi, href: '/products?category=maxi-dresses' },
    { label: t.nav.mini, href: '/products?category=mini-dresses' },
    { label: t.nav.summer, href: '/products?category=summer-dresses' },
    { label: t.nav.newArrivals, href: '/products?filter=new' },
  ];

  const careLinks = [
    { label: t.footer.shipping, href: '/shipping' },
    { label: t.footer.returns, href: '/returns' },
    { label: t.footer.contact, href: '/contact' },
    { label: t.account.orders, href: '/account/orders' },
  ];

  const promises = isRTL
    ? [
        { icon: '✦', label: 'شحن مجاني لمشتريات فوق $100' },
        { icon: '✦', label: 'إرجاع سهل خلال 30 يوماً' },
        { icon: '✦', label: 'دفع آمن ومشفر' },
        { icon: '✦', label: 'أقمشة فاخرة أصلية' },
      ]
    : [
        { icon: '✦', label: 'Free shipping over $100' },
        { icon: '✦', label: '30-day easy returns' },
        { icon: '✦', label: 'Secure checkout' },
        { icon: '✦', label: 'Authentic luxury fabrics' },
      ];

  return (
    <footer className="bg-brand-black text-white mt-20">
      {/* Newsletter */}
      <div className="border-b border-white/10 py-16">
        <div className="container-luxury text-center">
          <p className="section-subtitle text-white/40 mb-3">
            {isRTL ? 'ابقي على تواصل' : 'Stay Connected'}
          </p>
          <h2 className="font-display text-3xl text-white font-light mb-6">
            {isRTL ? 'انضمي إلى دائرتنا الخاصة' : 'Join the Inner Circle'}
          </h2>
          <p className="text-white/60 text-sm mb-8 max-w-md mx-auto font-body">
            {isRTL
              ? 'كوني أول من يكتشف التشكيلات الجديدة والعروض الحصرية.'
              : 'Be the first to discover new arrivals, exclusive events, and private sales.'}
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder={isRTL ? 'بريدك الإلكتروني' : 'Your email address'}
              className="flex-1 px-5 py-3 bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm font-body focus:outline-none focus:border-brand-gold transition-colors"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <button type="submit" className="px-8 py-3 bg-brand-gold text-white text-xs tracking-widest uppercase hover:bg-brand-gold/90 transition-colors">
              {isRTL ? 'اشتركي' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      {/* Links */}
      <div className="py-16">
        <div className="container-luxury grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="font-display text-2xl text-brand-gold font-light tracking-[0.2em] mb-6">YF14 Store</h3>
            <p className="text-white/50 text-sm font-body leading-relaxed">
              {t.footer.tagline}.
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href="https://www.instagram.com/yf14_store"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a
                href="https://www.facebook.com/YFStore"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@yf14_store"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white/80 hover:text-white transition-all hover:scale-110 border border-white/10"
                aria-label="TikTok"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-white/40 mb-5">{t.footer.collections}</h4>
            <ul className="space-y-3">
              {collections.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/60 hover:text-brand-gold transition-colors font-body">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-white/40 mb-5">{t.footer.help}</h4>
            <ul className="space-y-3">
              {careLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/60 hover:text-brand-gold transition-colors font-body">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-widest uppercase text-white/40 mb-5">
              {isRTL ? 'وعدنا لك' : 'Our Promise'}
            </h4>
            <ul className="space-y-4">
              {promises.map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <span className="text-brand-gold text-xs">{item.icon}</span>
                  <span className="text-sm text-white/60 font-body">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-6">
        <div className="container-luxury flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-xs font-body tracking-wide">
          <p>© {new Date().getFullYear()} YF14 Store. {t.footer.allRights}.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">{t.footer.privacyPolicy}</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">{t.footer.terms}</Link>
          </div>
          <div className="flex gap-2 items-center">
            <span>{isRTL ? 'وسائل الدفع:' : 'Payments:'}</span>
            {['Visa', 'MC', 'AmEx', 'Stripe'].map((p) => (
              <span key={p} className="px-2 py-0.5 border border-white/20 text-white/40 rounded text-[10px]">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
