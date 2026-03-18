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
            <div className="flex gap-4 mt-6">
              {['instagram', 'pinterest', 'facebook'].map((social) => (
                <a
                  key={social}
                  href={`https://${social}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 border border-white/20 flex items-center justify-center text-white/40 hover:border-brand-gold hover:text-brand-gold transition-colors text-xs capitalize"
                >
                  {social[0].toUpperCase()}
                </a>
              ))}
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
