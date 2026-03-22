import { NextSeo } from 'next-seo';
import Layout from '../components/layout/Layout';
import AnnouncementBar from '../components/layout/AnnouncementBar';
import HomeProductMarquee from '../components/home/HomeProductMarquee';
import DeliveryStrip from '../components/home/DeliveryStrip';
import ShopProductListing from '../components/shop/ShopProductListing';
import { useLang } from '../contexts/LanguageContext';

export default function HomePage() {
  const { t } = useLang();

  return (
    <Layout>
      <NextSeo
        title={`${t.siteName} — ${t.home.heroTitle} ${t.home.heroTitleEm}`}
        titleTemplate="%s"
      />

      {/* Hero + marquee — pt clears fixed navbar; navy fills top so no lavender gap above hero */}
      <section className="w-full max-w-full min-w-0 overflow-x-clip bg-nav-navy border-b border-white/[0.06] pt-[calc(5.5rem+env(safe-area-inset-top,0px))] lg:pt-[calc(7.75rem+env(safe-area-inset-top,0px))]">
        <div className="container-luxury py-5 md:py-6">
          <HomeProductMarquee />
        </div>
      </section>

      <DeliveryStrip />

      {/* Same rotating messages as top bar on other pages; here it sits under the strip */}
      <AnnouncementBar />

      {/* Filter + product grid — light page background */}
      <section
        className="relative z-10 w-full max-w-full min-w-0 overflow-x-clip border-t border-[#e8d0ee]/50 pt-0"
        style={{ background: 'linear-gradient(180deg, #fdf4ff 0%, #ffffff 18%)' }}
      >
        <ShopProductListing embed homeCompact />
      </section>
    </Layout>
  );
}
