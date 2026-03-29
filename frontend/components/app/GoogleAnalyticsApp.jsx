'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageView } from '../../lib/gtag';

function GoogleAnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams?.toString();
    const path = q ? `${pathname}?${q}` : pathname || '/';
    pageView(path);
  }, [pathname, searchParams]);

  return null;
}

/** useSearchParams() must be under Suspense (Next.js App Router). */
export default function GoogleAnalyticsApp() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsInner />
    </Suspense>
  );
}
