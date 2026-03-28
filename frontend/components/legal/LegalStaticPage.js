import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '../layout/Layout';
import { useLang } from '../../contexts/LanguageContext';

export default function LegalStaticPage({ docKey }) {
  const { t, isRTL } = useLang();
  const doc = t[docKey];

  return (
    <Layout>
      <NextSeo title={`${doc.metaTitle} — ${t.siteName}`} description={doc.metaDesc} />
      <div
        className="w-full min-h-[calc(100vh-8rem)] pb-16 pt-8 md:pt-12 bg-[#0f0f1a] text-white"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="container-luxury max-w-3xl">

          {/* Page header */}
          <header className="relative mb-8 md:mb-10">
            <p className="text-brand-purple-light text-[11px] tracking-[0.25em] uppercase font-body mb-3">
              {doc.eyebrow}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-light text-white tracking-tight mb-2">
              {doc.title}
            </h1>
            <p className="text-white/50 text-sm font-body">{doc.lastUpdated}</p>
            <span className="absolute top-0 end-0 text-white/15 text-xl leading-none select-none" aria-hidden>
              ···
            </span>
          </header>

          {/* Sections card */}
          <section className="rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.04]">
            <div className="px-5 py-3.5 bg-white/[0.06] border-b border-white/[0.06]">
              <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-brand-purple-light font-body">
                {doc.title}
              </h2>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {doc.sections.map((s, i) => (
                <div key={i} className="px-5 py-5 flex gap-4">
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold font-body mt-0.5"
                    style={{
                      background: 'rgba(139,43,226,0.18)',
                      color: '#c084fc',
                      border: '1px solid rgba(139,43,226,0.25)',
                    }}
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold font-body text-white mb-2 leading-snug">
                      {s.title}
                    </h3>
                    <p className="text-[14px] leading-relaxed font-body text-white/60">
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer links */}
          <div className="mt-10 pt-6 border-t border-white/[0.08] flex flex-wrap gap-6">
            <Link
              href="/contact"
              className="text-sm font-body text-brand-purple hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              {t.footer.contact}
            </Link>
            <Link
              href="/products"
              className="text-sm font-body text-brand-purple hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              {t.contactPage.bottomShop}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
