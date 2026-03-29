'use client';

import useAuthStore from '../store/authStore';
import AppProviders from './AppProviders';

function PagesInner({ Component, pageProps }) {
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const getLayout = Component.getLayout || ((page) => page);
  const enrichedPageProps = { ...pageProps, isAuthReady };
  return getLayout(<Component {...enrichedPageProps} />);
}

export default function PagesApp({ Component, pageProps }) {
  return (
    <AppProviders>
      <PagesInner Component={Component} pageProps={pageProps} />
    </AppProviders>
  );
}
