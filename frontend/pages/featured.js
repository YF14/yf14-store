import { NextSeo } from 'next-seo';
import Layout from '../components/layout/Layout';
import ShopProductListing from '../components/shop/ShopProductListing';
import { useLang } from '../contexts/LanguageContext';

export default function FeaturedPage() {
  const { t } = useLang();

  return (
    <Layout>
      <NextSeo
        title={`${t.nav.featured} — ${t.siteName}`}
        titleTemplate="%s"
        description={t.shop.featuredPageDescription}
      />
      <ShopProductListing featuredMode skipPageSeo />
    </Layout>
  );
}
