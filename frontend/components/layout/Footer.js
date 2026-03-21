import Link from 'next/link';
import { useLang } from '../../contexts/LanguageContext';
import StoreLogoImage from './StoreLogoImage';

const ftHeading = 'text-[10px] tracking-[0.2em] uppercase text-[#a78bfa]/90 mb-2.5 font-medium';

function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TruckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
      />
    </svg>
  );
}

function ClockIconSmall({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CardIconSmall({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
      />
    </svg>
  );
}

export default function Footer() {
  const { t, isRTL } = useLang();

  const whatsappRaw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
  const whatsappHref = whatsappRaw
    ? `https://wa.me/${whatsappRaw.replace(/\D/g, '')}`
    : '/contact';

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
    { label: t.footer.sizeGuideLink, href: '/size-guide' },
    { label: t.footer.trackOrder, href: '/account/orders' },
    { label: t.footer.contact, href: '/contact' },
  ];

  const iconWrap =
    'w-8 h-8 rounded-full border border-white/25 flex items-center justify-center text-white/80 hover:text-white hover:border-brand-purple/80 hover:bg-white/[0.06] transition-all';

  const f = t.footer;
  const rowClass = 'flex items-start gap-2.5';
  const iconClass = 'w-4 h-4 text-brand-purple flex-shrink-0 mt-0.5';

  return (
    <footer className="w-full max-w-full min-w-0 overflow-x-hidden text-white mt-12 bg-[#0a0a12]" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, #8b2be2, #d63384, #8b2be2)' }} />

      <div className="py-7 md:py-8">
        {/* Same DOM order always: brand, collections, help, delivery. With footer dir=rtl, grid column 1 is on the visual right (RTL flow). */}
        <div className="container-luxury grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 md:gap-8 lg:gap-6">
          <div className="sm:col-span-2 lg:col-span-1 flex flex-col items-start">
            <div className="flex items-center gap-2 mb-3">
              <Link
                href="/"
                className="relative flex-shrink-0 block w-12 h-12 rounded-full overflow-hidden bg-[#0a0a12] shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
              >
                <StoreLogoImage
                  fill
                  className="object-contain object-center p-[3px] rounded-full"
                  sizes="48px"
                />
              </Link>
              <span className="font-display text-base text-white/95 font-light tracking-[0.14em]">{t.siteName}</span>
            </div>

            <p className="font-display text-xl md:text-2xl text-white/85 leading-snug tracking-wide max-w-xs mb-4">
              {f.tagline}
            </p>

            <div className="flex gap-2">
              <a
                href="https://www.instagram.com/yf14_store"
                target="_blank"
                rel="noopener noreferrer"
                className={iconWrap}
                aria-label="Instagram"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/YFStore"
                target="_blank"
                rel="noopener noreferrer"
                className={iconWrap}
                aria-label="Facebook"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={iconWrap}
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className={ftHeading}>{f.collections}</h4>
            <ul className="space-y-1.5">
              {collections.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[13px] text-white/60 hover:text-[#c4b5fd] transition-colors font-body leading-snug">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={ftHeading}>{f.help}</h4>
            <ul className="space-y-1.5">
              {careLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[13px] text-white/60 hover:text-[#c4b5fd] transition-colors font-body leading-snug">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className={ftHeading}>{f.deliveryInfoHeading}</h4>
            <Link href="/shipping" className="block rounded-xl bg-[#16162d] border border-white/[0.08] p-3 max-w-[280px] hover:border-brand-purple/30 transition-colors">
              <div className={`${rowClass} mb-2.5`}>
                <TruckIcon className={iconClass} />
                <p className="text-[11px] text-white/70 leading-snug font-body">{f.footerDeliveryLine1}</p>
              </div>
              <div className={`${rowClass} mb-2.5`}>
                <ClockIconSmall className={iconClass} />
                <p className="text-[11px] text-white/70 leading-snug font-body">
                  {f.footerDeliveryOrderBefore}{' '}
                  <span className="text-brand-purple font-semibold">{f.footerDeliveryCutoff}</span>
                </p>
              </div>
              <div className={rowClass}>
                <CardIconSmall className={iconClass} />
                <p className="text-[11px] text-white/70 leading-snug font-body">
                  <span className="text-brand-purple font-semibold">{f.footerDeliveryFee}</span>
                  {' · '}
                  {f.footerDeliveryCod}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/[0.07] bg-gradient-to-b from-white/[0.04] via-transparent to-transparent">
        <div
          className="absolute inset-x-0 top-0 h-px max-w-md mx-auto opacity-60"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(196, 164, 106, 0.35), transparent)' }}
          aria-hidden
        />
        <div
          className={`container-luxury flex flex-col sm:flex-row items-center justify-between gap-3 py-4 md:py-5 ${
            isRTL ? 'sm:flex-row-reverse' : ''
          }`}
        >
          <p className="text-[10px] text-white/55 font-body tracking-wide text-center sm:text-start leading-snug">
            © {new Date().getFullYear()} {t.siteName}. {f.allRights}.
          </p>
          <nav
            className="flex items-center gap-0.5 sm:gap-0"
            aria-label={isRTL ? 'روابط قانونية' : 'Legal'}
          >
            <Link
              href="/privacy"
              className="px-2 py-1 text-[9px] tracking-[0.12em] uppercase text-white/65 font-body hover:text-brand-gold transition-colors duration-300 rounded hover:bg-white/[0.06]"
            >
              {f.privacyPolicy}
            </Link>
            <span className="hidden sm:block w-px h-2.5 bg-white/15" aria-hidden />
            <Link
              href="/terms"
              className="px-2 py-1 text-[9px] tracking-[0.12em] uppercase text-white/65 font-body hover:text-brand-gold transition-colors duration-300 rounded hover:bg-white/[0.06]"
            >
              {f.terms}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
