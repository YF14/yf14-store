'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { checkApiHealth } from '../lib/apiHealth';
import MaintenanceScreen from './MaintenanceScreen';
import { useLang } from '../contexts/LanguageContext';

const HEALTH_TIMEOUT_MS = 12_000;
const AUTO_RECHECK_MS = 45_000;

function envFlagTrue(v) {
  return v === '1' || v === 'true' || v === 'yes';
}

function envFlagFalse(v) {
  return v === '0' || v === 'false' || v === 'no';
}

function shouldRunAutoGate() {
  if (typeof process !== 'undefined' && envFlagTrue(process.env.NEXT_PUBLIC_MAINTENANCE_MODE)) {
    return false;
  }
  if (envFlagTrue(process.env.NEXT_PUBLIC_MAINTENANCE_GATE)) {
    return true;
  }
  if (envFlagFalse(process.env.NEXT_PUBLIC_MAINTENANCE_GATE)) {
    return false;
  }
  return process.env.NODE_ENV === 'production';
}

function isMaintenanceRoute() {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname;
  return p === '/maintenance' || p.startsWith('/maintenance/');
}

export default function ApiAvailabilityGate({ children }) {
  const { t, isRTL } = useLang();
  const runGate = shouldRunAutoGate();
  const forced = envFlagTrue(process.env.NEXT_PUBLIC_MAINTENANCE_MODE);

  const [phase, setPhase] = useState(() => {
    if (forced) return 'down';
    if (!runGate) return 'ok';
    return 'checking';
  });

  const [retrying, setRetrying] = useState(false);
  const abortRef = useRef(null);

  const runCheck = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const ac = new AbortController();
    abortRef.current = ac;
    const tid = setTimeout(() => ac.abort(), HEALTH_TIMEOUT_MS);
    try {
      return await checkApiHealth(ac.signal);
    } catch {
      return false;
    } finally {
      clearTimeout(tid);
    }
  }, []);

  useEffect(() => {
    if (forced) return undefined;
    if (!runGate) return undefined;

    let cancelled = false;

    const init = async () => {
      if (isMaintenanceRoute()) {
        setPhase('ok');
        return;
      }
      setPhase('checking');
      const ok = await runCheck();
      if (cancelled) return;
      setPhase(ok ? 'ok' : 'down');
    };

    init();

    return () => {
      cancelled = true;
      if (abortRef.current) abortRef.current.abort();
    };
  }, [forced, runGate, runCheck]);

  useEffect(() => {
    if (forced || !runGate || phase !== 'down') return undefined;
    const id = setInterval(async () => {
      if (isMaintenanceRoute()) return;
      const ok = await runCheck();
      if (ok) setPhase('ok');
    }, AUTO_RECHECK_MS);
    return () => clearInterval(id);
  }, [forced, runGate, phase, runCheck]);

  const onRetry = useCallback(async () => {
    setRetrying(true);
    try {
      const ok = await runCheck();
      if (ok) setPhase('ok');
    } finally {
      setRetrying(false);
    }
  }, [runCheck]);

  if (forced) {
    return <MaintenanceScreen />;
  }

  if (!runGate) {
    return children;
  }

  if (phase === 'checking') {
    return (
      <div
        className="flex min-h-screen min-h-[100dvh] items-center justify-center px-6"
        style={{
          background: 'var(--cream)',
          color: 'var(--warm-gray)',
          fontFamily: isRTL ? 'Tajawal, sans-serif' : 'Jost, system-ui, sans-serif',
        }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <p className="text-sm font-light tracking-wide">{t.maintenance.checking}</p>
      </div>
    );
  }

  if (phase === 'down') {
    return <MaintenanceScreen onRetry={onRetry} retrying={retrying} />;
  }

  return children;
}
