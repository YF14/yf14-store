import { NextSeo } from 'next-seo';
import Layout from '../components/layout/Layout';
import ShopProductListing from '../components/shop/ShopProductListing';
import { useLang } from '../contexts/LanguageContext';

export default function BestSellersPage() {
  const { t } = useLang();

  return (
    <Layout>
      <NextSeo
        title={`${t.nav.bestSellers} — ${t.siteName}`}
        titleTemplate="%s"
        description={t.shop.bestSellersPageDescription}
      />
      <ShopProductListing bestSellerMode skipPageSeo />
    </Layout>
  );
}
