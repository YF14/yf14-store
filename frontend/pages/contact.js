import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '../components/layout/Layout';
import { useLang } from '../contexts/LanguageContext';

const BG = '#0f1117';
const CARD = '#1a1d2e';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT = '#e8e8f0';
const MUTED = '#9ca3af';
const MUTED_DIM = '#6b7280';
const PURPLE = '#8b5cf6';
const PURPLE_LIGHT = '#a78bfa';
const PURPLE_BG = 'rgba(139,92,246,0.12)';
const YELLOW_BG = 'rgba(234,179,8,0.1)';
const YELLOW_BORDER = 'rgba(234,179,8,0.18)';

const IG_DEFAULT = 'https://www.instagram.com/yf14_store';
const FB_DEFAULT = 'https://www.facebook.com/yf14store';

export default function ContactPage() {
  const { t, isRTL } = useLang();
  const c = t.contactPage;
  const r = t.returnsPage;

  const igUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || IG_DEFAULT;
  const fbUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || FB_DEFAULT;
  const waRaw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
  const waDigits = waRaw.replace(/\D/g, '');
  const waUrl = waDigits ? `https://wa.me/${waDigits}` : null;
  const igHandle = process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || '@yf14_store';
  const fbDisplay = process.env.NEXT_PUBLIC_FACEBOOK_DISPLAY || 'facebook.com/yf14store';
  const waDisplay = process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY || (waDigits ? `+${waDigits}` : 'WhatsApp');

  const rowBase =
    'flex items-center justify-start gap-3.5 py-4 border-b last:border-b-0 border-white/[0.07] text-inherit no-underline transition-opacity hover:opacity-75';

  return (
    <Layout>
      <NextSeo title={c.metaTitle} description={c.metaDesc} />

      <div
        className="flex-1 flex flex-col w-full min-h-0 pb-10 sm:pb-12 pt-2"
        style={{ backgroundColor: BG, color: TEXT }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="w-full max-w-[min(100%,720px)] mx-auto px-5 sm:px-8 flex-1 flex flex-col">
          {/* Breadcrumb + header */}
          <header className="text-center pt-10 sm:pt-12 pb-6 sm:pb-8">
            <nav
              className="flex flex-wrap items-center justify-center gap-1.5 text-xs sm:text-sm mb-5"
              style={{ color: MUTED_DIM }}
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:opacity-80 transition-opacity" style={{ color: MUTED_DIM }}>
                {t.siteName}
              </Link>
              <span aria-hidden>/</span>
              <span style={{ color: MUTED }}>{c.pageTitle}</span>
            </nav>
            <h1 className="text-[clamp(1.85rem,5vw,2.35rem)] font-bold font-body tracking-tight mb-2">
              {c.pageTitle}
            </h1>
            <p className="text-sm" style={{ color: MUTED }}>
              {c.pageSub}
            </p>
          </header>

          <div className="flex flex-col gap-3.5 sm:gap-4">
            {/* WhatsApp highlight */}
            <div
              className="rounded-2xl px-5 sm:px-6 py-5 sm:py-5 flex items-start gap-4 border"
              style={{
                backgroundColor: PURPLE_BG,
                borderColor: 'rgba(139,92,246,0.22)',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: PURPLE }}
                aria-hidden
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 text-start">
                <p className="text-base font-bold font-body mb-1.5">{c.waCardTitle}</p>
                <p className="text-[13px] leading-[1.85]" style={{ color: MUTED }}>
                  {c.waCardBeforeLink}
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:underline"
                      style={{ color: PURPLE_LIGHT }}
                    >
                      {c.socialWa}
                    </a>
                  ) : (
                    <span className="font-semibold" style={{ color: PURPLE_LIGHT }}>
                      {c.socialWa}
                    </span>
                  )}
                  {c.waCardAfterLink}
                </p>
              </div>
            </div>

            {/* Social card */}
            <div
              className="rounded-2xl border px-5 sm:px-7 py-6 sm:py-6"
              style={{ backgroundColor: CARD, borderColor: BORDER }}
            >
              <h2 className="text-base font-bold font-body mb-4 text-start">{c.socialSectionTitle}</h2>

              <a href={igUrl} target="_blank" rel="noopener noreferrer" className={rowBase}>
                <div
                  className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]"
                  aria-hidden
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.5" fill="white" />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5 text-start min-w-0">
                  <span className="text-[15px] font-semibold">{c.socialIg}</span>
                  <span className="text-xs" style={{ color: MUTED }}>
                    {igHandle}
                  </span>
                </div>
              </a>

              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className={rowBase}>
                <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 bg-[#1877f2]" aria-hidden>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="white">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5 text-start min-w-0">
                  <span className="text-[15px] font-semibold">{c.socialFb}</span>
                  <span className="text-xs truncate" style={{ color: MUTED }}>
                    {fbDisplay}
                  </span>
                </div>
              </a>

              <a
                href={waUrl || igUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={rowBase}
              >
                <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 bg-[#25d366]" aria-hidden>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5 text-start min-w-0">
                  <span className="text-[15px] font-semibold">{c.socialWa}</span>
                  <bdi dir="ltr" className="text-xs inline-block" translate="no" style={{ color: MUTED }}>
                    {waDisplay}
                  </bdi>
                </div>
              </a>
            </div>

            {/* Product photos warning */}
            <div
              className="rounded-2xl px-5 sm:px-6 py-5 flex items-start gap-3.5 border"
              style={{ backgroundColor: YELLOW_BG, borderColor: YELLOW_BORDER }}
            >
              <span className="text-xl shrink-0 leading-none" aria-hidden>
                ⚠️
              </span>
              <p className="text-[13px] leading-[1.85] flex-1 text-start" style={{ color: MUTED }}>
                {r.warnLead}
                {waUrl ? (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:underline"
                    style={{ color: PURPLE_LIGHT }}
                  >
                    {r.warnWhatsApp}
                  </a>
                ) : (
                  <span className="font-semibold" style={{ color: PURPLE_LIGHT }}>
                    {r.warnWhatsApp}
                  </span>
                )}
                {r.warnTail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
