import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { trackPageView, GA_MEASUREMENT_ID, META_PIXEL_ID } from '../lib/analytics';

/**
 * Pages Router: track GA4 + Meta PageView on load and on client navigations.
 * (App Router equivalent: usePathname() + useEffect.)
 */
export default function RouteAnalytics() {
  const router = useRouter();
  const didInitPageView = useRef(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID && !META_PIXEL_ID) return undefined;
    const handle = (url) => trackPageView(url, { includeMetaPixel: true });
    router.events.on('routeChangeComplete', handle);
    return () => router.events.off('routeChangeComplete', handle);
  }, [router.events]);

  useEffect(() => {
    if (!router.isReady || didInitPageView.current) return;
    if (!GA_MEASUREMENT_ID && !META_PIXEL_ID) return;
    didInitPageView.current = true;
    // Meta: first PageView is sent by the official snippet in AppProviders (avoid duplicate).
    trackPageView(router.asPath, { includeMetaPixel: !META_PIXEL_ID });
  }, [router.isReady, router.asPath]);

  return null;
}
