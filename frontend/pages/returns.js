import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '../components/layout/Layout';
import { useLang } from '../contexts/LanguageContext';

function CheckIconWhite() {
  return (
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CheckIconGreen() {
  return (
    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIconRed() {
  return (
    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-6 h-6 text-amber-900/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

export default function ReturnsPage() {
  const { t, isRTL } = useLang();
  const p = t.returnsPage;

  const whatsappRaw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
  const whatsappHref = whatsappRaw ? `https://wa.me/${whatsappRaw.replace(/\D/g, '')}` : '/contact';

  const whenItems = [
    { title: p.when1Title, desc: p.when1Desc },
    { title: p.when2Title, desc: p.when2Desc },
  ];

  const notItems = [p.not2, p.not3];

  return (
    <Layout>
      <NextSeo title={`${p.metaTitle} — ${t.siteName}`} description={p.metaDesc} />
      <div
        className="w-full min-h-[calc(100vh-8rem)] pb-16 pt-8 md:pt-12 bg-[#0f0f1a] text-white"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="container-luxury max-w-3xl">
          <header className="relative mb-8 md:mb-10">
            <p className="text-brand-purple-light text-[11px] tracking-[0.25em] uppercase font-body mb-3">{p.eyebrow}</p>
            <h1 className="font-display text-3xl md:text-4xl font-light text-white tracking-tight mb-2">{p.title}</h1>
            <p className="text-white/55 text-sm md:text-base font-body">{p.subtitle}</p>
            <span className="absolute top-0 end-0 text-white/15 text-xl leading-none select-none" aria-hidden>
              ···
            </span>
          </header>

          {/* Primary policy — lavender / purple */}
          <div className="rounded-2xl bg-[#e8ddff]/95 border border-brand-purple/25 p-5 md:p-6 mb-6 flex gap-4">
            <div
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(145deg, #8b2be2, #6d1eb8)' }}
              aria-hidden
            >
              <CheckIconWhite />
            </div>
            <div className="min-w-0">
              <h2 className="text-brand-purple-dark font-body font-semibold text-base md:text-lg leading-snug mb-2">
                {p.heroTitle}
              </h2>
              <p className="text-brand-purple-dark/90 text-sm leading-relaxed font-body">{p.heroBody}</p>
            </div>
          </div>

          {/* When can you return */}
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 md:p-6 mb-6">
            <h2 className="text-white font-body font-semibold text-base mb-5">{p.whenTitle}</h2>
            <ul className="space-y-6">
              {whenItems.map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm"
                    aria-hidden
                  >
                    <CheckIconGreen />
                  </div>
                  <div>
                    <p className="text-white font-body font-medium text-sm mb-1">{item.title}</p>
                    <p className="text-white/55 text-sm leading-relaxed font-body">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* We do not accept */}
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.04] overflow-hidden mb-6">
            <div className="px-5 py-4 md:px-6 border-b border-white/[0.06]">
              <h2 className="text-white font-body font-semibold text-base">{p.notTitle}</h2>
            </div>
            <ul className="divide-y divide-white/[0.06]">
              <li className="px-5 py-4 md:px-6 flex gap-3 items-start">
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center mt-0.5"
                  aria-hidden
                >
                  <XIconRed />
                </span>
                <p className="text-white/70 text-sm leading-relaxed font-body pt-0.5">
                  {p.not1Prefix}
                  <Link href="/size-guide" className="text-brand-purple-light hover:text-brand-purple underline-offset-2 hover:underline">
                    {p.sizeGuideLink}
                  </Link>
                  {p.not1Suffix}
                </p>
              </li>
              {notItems.map((text, i) => (
                <li key={i} className="px-5 py-4 md:px-6 flex gap-3 items-start">
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center mt-0.5"
                    aria-hidden
                  >
                    <XIconRed />
                  </span>
                  <p className="text-white/70 text-sm leading-relaxed font-body pt-0.5">{text}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Warning / contact */}
          <div className="rounded-2xl border border-amber-200/35 bg-[#f7efd8] p-5 md:p-6 flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-200/80 flex items-center justify-center" aria-hidden>
              <AlertIcon />
            </div>
            <p className="text-[#3a2a18] text-sm leading-relaxed font-body">
              {p.warnLead}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-purple-dark underline-offset-2 hover:underline"
              >
                {p.warnWhatsApp}
              </a>
              {p.warnTail}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
