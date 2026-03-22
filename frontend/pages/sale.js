import { NextSeo } from 'next-seo';
import Layout from '../components/layout/Layout';
import ShopProductListing from '../components/shop/ShopProductListing';
import { useLang } from '../contexts/LanguageContext';

export default function SalePage() {
  const { t } = useLang();

  return (
    <Layout>
      <NextSeo
        title={`${t.nav.sale} — ${t.siteName}`}
        titleTemplate="%s"
        description={t.shop.salePageDescription}
      />
      <ShopProductListing saleMode skipPageSeo />
    </Layout>
  );
}
