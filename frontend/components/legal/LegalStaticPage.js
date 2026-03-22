import Link from 'next/link';
import { NextSeo } from 'next-seo';
import Layout from '../layout/Layout';
import { useLang } from '../../contexts/LanguageContext';

const CREAM = '#faf8f5';
const CHARCOAL = '#1a1a1a';
const MUTED = '#8a8580';
const ACCENT = '#c9a96e';
const BORDER = '#e8e4de';

export default function LegalStaticPage({ docKey }) {
  const { t, isRTL } = useLang();
  const doc = t[docKey];

  return (
    <Layout>
      <NextSeo title={`${doc.metaTitle} — ${t.siteName}`} description={doc.metaDesc} />
      <div className="min-h-screen pb-20" style={{ backgroundColor: CREAM }} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-3xl mx-auto px-6 sm:px-10 pt-12 sm:pt-16 animate-fade-up">
          <p className="text-[11px] tracking-[0.28em] uppercase mb-3 font-body" style={{ color: MUTED }}>
            {doc.eyebrow}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-light tracking-tight mb-2" style={{ color: CHARCOAL }}>
            {doc.title}
          </h1>
          <p className="text-sm mb-10 font-body" style={{ color: MUTED }}>
            {doc.lastUpdated}
          </p>

          <div className="space-y-10">
            {doc.sections.map((s, i) => (
              <section key={i}>
                <h2 className="text-base font-semibold font-body mb-3" style={{ color: CHARCOAL }}>
                  {s.title}
                </h2>
                <p className="text-[15px] leading-relaxed font-body" style={{ color: `${CHARCOAL}cc` }}>
                  {s.body}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t flex flex-wrap gap-6" style={{ borderColor: BORDER }}>
            <Link
              href="/contact"
              className="text-sm font-body underline-offset-4 hover:underline transition-opacity"
              style={{ color: ACCENT }}
            >
              {t.footer.contact}
            </Link>
            <Link
              href="/products"
              className="text-sm font-body underline-offset-4 hover:underline transition-opacity"
              style={{ color: ACCENT }}
            >
              {t.contactPage.bottomShop}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
