import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { DefaultSeo } from 'next-seo';
import '../styles/globals.css';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import { LanguageProvider, useLang } from '../contexts/LanguageContext';

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

function AppInner({ Component, pageProps }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const initGuest = useCartStore((s) => s.initGuest);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const { t, locale, isRTL } = useLang();

  useEffect(() => {
    fetchMe();
    initGuest(); // load guest cart from localStorage
  }, []);

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchWishlist();
    }
  }, [user]);

  const getLayout = Component.getLayout || ((page) => page);

  // Inject isAuthReady so protected pages can delay redirect guards until
  // fetchMe() has settled — prevents spurious logout on hard reload.
  const enrichedPageProps = { ...pageProps, isAuthReady };

  return (
    <QueryClientProvider client={queryClient}>
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
      {getLayout(<Component {...enrichedPageProps} />)}
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
    </QueryClientProvider>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <AppInner Component={Component} pageProps={pageProps} />
    </LanguageProvider>
  );
}
