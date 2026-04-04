import Head from 'next/head';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import MaintenanceScreen from '../components/MaintenanceScreen';
import { checkApiHealth } from '../lib/apiHealth';
import { useLang } from '../contexts/LanguageContext';

/** Standalone URL for “store unavailable” — same UI as the automatic gate. */
export default function MaintenancePage() {
  const router = useRouter();
  const { t } = useLang();
  const [retrying, setRetrying] = useState(false);

  const onRetry = useCallback(async () => {
    setRetrying(true);
    try {
      const ok = await checkApiHealth();
      if (ok) router.replace('/');
    } finally {
      setRetrying(false);
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>{t.maintenance.title}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <MaintenanceScreen onRetry={onRetry} retrying={retrying} />
    </>
  );
}
