import Link from 'next/link';
import Layout from '../components/layout/Layout';
import { useLang } from '../contexts/LanguageContext';

export default function NotFound() {
  const { t, isRTL } = useLang();
  return (
    <Layout>
      <div className="container-luxury py-32 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <p className="font-display text-[120px] font-light text-brand-black/10 leading-none mb-0">404</p>
        <h1 className="font-display text-5xl font-light -mt-6 mb-4">{t.pages.notFoundTitle}</h1>
        <p className="text-brand-warm-gray mb-10 max-w-md mx-auto">
          {t.pages.notFoundDesc}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/" className="btn-primary">{t.pages.returnHome}</Link>
          <Link href="/products" className="btn-outline">{t.pages.shopCollection}</Link>
        </div>
      </div>
    </Layout>
  );
}
