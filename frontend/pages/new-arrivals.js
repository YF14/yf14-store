import { NextSeo } from 'next-seo';
import Layout from '../components/layout/Layout';
import ShopProductListing from '../components/shop/ShopProductListing';
import { useLang } from '../contexts/LanguageContext';

export default function NewArrivalsPage() {
  const { t } = useLang();

  return (
    <Layout>
      <NextSeo
        title={`${t.nav.newArrivals} — ${t.siteName}`}
        titleTemplate="%s"
        description={t.shop.newArrivalsPageDescription}
      />
      <ShopProductListing newArrivalMode skipPageSeo />
    </Layout>
  );
}
