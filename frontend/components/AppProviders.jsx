'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { DefaultSeo } from 'next-seo';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import { LanguageProvider, useLang } from '../contexts/LanguageContext';
import RouteAnalytics from './RouteAnalytics';
import GtagScripts from './analytics/GtagScripts';
import GoogleAnalyticsApp from './app/GoogleAnalyticsApp';
import ApiAvailabilityGate from './ApiAvailabilityGate';
import { META_PIXEL_ID } from '../lib/analytics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});

function AuthBootstrap() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const initGuest = useCartStore((s) => s.initGuest);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  useEffect(() => {
    fetchMe();
    initGuest();
  }, [fetchMe, initGuest]);

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchWishlist();
    }
  }, [user, fetchCart, fetchWishlist]);

  return null;
}

function AppChrome({ children, appRouterRoot }) {
  const { t, locale, isRTL } = useLang();

  return (
    <>
      <GtagScripts />
      {META_PIXEL_ID ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}
      {appRouterRoot ? <GoogleAnalyticsApp /> : <RouteAnalytics />}
      <DefaultSeo
        defaultTitle={`${t.siteName} — ${t.home.heroTitle}`}
        titleTemplate={`%s | ${t.siteName}`}
        description={t.home.heroSubtitle}
        openGraph={{
          type: 'website',
          locale: locale === 'ar' ? 'ar_SA' : 'en_US',
          url: process.env.NEXT_PUBLIC_SITE_URL,
          siteName: t.siteName,
        }}
      />
      {children}
      <Toaster
        position={isRTL ? 'top-left' : 'top-right'}
        toastOptions={{
          style: {
            fontFamily: isRTL ? 'Tajawal, sans-serif' : 'Jost, sans-serif',
            fontSize: '13px',
            letterSpacing: isRTL ? '0' : '0.02em',
            borderRadius: '2px',
            background: '#0a0a0a',
            color: '#fff',
            direction: isRTL ? 'rtl' : 'ltr',
          },
          success: { iconTheme: { primary: '#c9a96e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </>
  );
}

/**
 * @param {{ children: React.ReactNode, appRouterRoot?: boolean }} props
 * appRouterRoot: true when used from app/layout.js — GA page_view via usePathname(); false for Pages Router (RouteAnalytics).
 */
export default function AppProviders({ children, appRouterRoot = false }) {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <ApiAvailabilityGate>
          <AuthBootstrap />
          <AppChrome appRouterRoot={appRouterRoot}>{children}</AppChrome>
        </ApiAvailabilityGate>
      </QueryClientProvider>
    </LanguageProvider>
  );
}
