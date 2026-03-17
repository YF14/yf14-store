import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { DefaultSeo } from 'next-seo';
import '../styles/globals.css';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 },
  },
});

export default function App({ Component, pageProps }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchWishlist();
    }
  }, [user]);

  const getLayout = Component.getLayout || ((page) => page);

  return (
    <QueryClientProvider client={queryClient}>
      <DefaultSeo
        defaultTitle="YF14 Store — The Art of Feminine Elegance"
        titleTemplate="%s | YF14 Store"
        description="Discover YF14 Store's curated collection of luxury women's dresses. Timeless elegance, impeccable craftsmanship."
        openGraph={{
          type: 'website',
          locale: 'en_US',
          url: process.env.NEXT_PUBLIC_SITE_URL,
          siteName: 'YF14 Store',
        }}
      />
      {getLayout(<Component {...pageProps} />)}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Jost, sans-serif',
            fontSize: '13px',
            letterSpacing: '0.02em',
            borderRadius: '2px',
            background: '#0a0a0a',
            color: '#fff',
          },
          success: { iconTheme: { primary: '#c9a96e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
