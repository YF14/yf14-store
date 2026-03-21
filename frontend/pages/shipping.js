import { NextSeo } from 'next-seo';
import Layout from '../components/layout/Layout';
import { useLang } from '../contexts/LanguageContext';

function TruckIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-5 h-5 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

export default function ShippingPage() {
  const { t, isRTL } = useLang();
  const p = t.shippingPage;
  const f = t.footer;

  const zones = [
    { key: 'z1', label: p.zone1 },
    { key: 'z2', label: p.zone2 },
    { key: 'z3', label: p.zone3 },
  ];
  const notes = [p.note1, p.note2, p.note3, p.note4];

  return (
    <Layout>
      <NextSeo title={`${p.metaTitle} — ${t.siteName}`} description={p.metaDesc} />
      <div
        className="w-full min-h-[calc(100vh-8rem)] pb-16 pt-8 md:pt-12 bg-[#0f0f1a] text-white"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="container-luxury max-w-3xl">
          {/* Page header */}
          <header className="relative mb-8 md:mb-10">
            <p className="text-brand-purple-light text-[11px] tracking-[0.25em] uppercase font-body mb-3">{p.eyebrow}</p>
            <h1 className="font-display text-3xl md:text-4xl font-light text-white tracking-tight mb-2">{p.title}</h1>
            <p className="text-white/55 text-sm md:text-base font-body">{p.subtitle}</p>
            <span className="absolute top-0 end-0 text-white/15 text-xl leading-none select-none" aria-hidden>
              ···
            </span>
          </header>

          <div className="rounded-xl bg-[#1e1e35] border border-white/[0.08] px-4 py-3 mb-8 max-w-lg">
            <p className="text-[11px] font-medium text-brand-purple-light mb-1">{f.deliveryInfoTitle}</p>
            <p className="text-sm text-white/65 font-body leading-relaxed">{f.deliveryInfoBox}</p>
          </div>

          {/* Featured banner */}
          <div className="rounded-2xl bg-brand-purple-light/90 border border-brand-purple/20 p-5 md:p-6 mb-8 flex gap-4">
            <div
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(145deg, #8b2be2, #6d1eb8)' }}
              aria-hidden
            >
              <TruckIcon />
            </div>
            <div className="min-w-0">
              <h2 className="text-brand-purple-dark font-body font-semibold text-base md:text-lg leading-snug mb-1.5">
                {p.bannerTitle}
              </h2>
              <p className="text-brand-purple-dark/85 text-sm leading-relaxed font-body">{p.bannerSubtitle}</p>
            </div>
          </div>

          {/* Delivery zones */}
          <section className="rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.04] mb-8">
            <div className="px-4 py-3 bg-white/[0.06] border-b border-white/[0.06]">
              <h2 className="text-sm font-body font-medium tracking-wide text-white">{p.zonesTitle}</h2>
            </div>
            <ul className="divide-y divide-white/[0.06]">
              {zones.map((z) => (
                <li key={z.key} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-brand-purple flex-shrink-0" aria-hidden />
                    <span className="text-white/75 text-sm font-body leading-snug">{z.label}</span>
                  </span>
                  <span className="flex-shrink-0 rounded-full bg-brand-purple-light/50 text-brand-purple-dark px-3 py-1 text-[11px] font-medium tracking-wide">
                    {p.nextDay}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Two-column info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ClockIcon />
                </div>
                <h2 className="font-body font-semibold text-white text-sm pt-2">{p.cutoffTitle}</h2>
              </div>
              <p className="text-white/65 text-sm leading-relaxed font-body">
                {p.cutoffA}{' '}
                <span className="text-brand-purple font-medium">{p.cutoffTime}</span>{' '}
                {p.cutoffB}{' '}
                <span className="text-brand-purple font-medium">{p.cutoffTime}</span> {p.cutoffC}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <PhoneIcon />
                </div>
                <h2 className="font-body font-semibold text-white text-sm pt-2">{p.confirmTitle}</h2>
              </div>
              <p className="text-white/65 text-sm leading-relaxed font-body">
                {p.confirmA}{' '}
                <span className="text-brand-purple font-medium">{p.whatsapp}</span>. {p.confirmB}
              </p>
            </div>
          </div>

          {/* Important notes */}
          <section className="rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.04]">
            <div className="px-4 py-3 bg-white/[0.06] border-b border-white/[0.06]">
              <h2 className="text-sm font-body font-medium tracking-wide text-white">{p.notesTitle}</h2>
            </div>
            <ul className="divide-y divide-white/[0.06]">
              {notes.map((text, i) => (
                <li key={i} className="px-4 py-3.5 flex gap-3">
                  <span className="w-2 h-2 rounded-full bg-brand-purple mt-1.5 flex-shrink-0" aria-hidden />
                  <span className="text-white/60 text-sm leading-relaxed font-body">{text}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
}
