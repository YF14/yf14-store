'use client';

import { useLang } from '../contexts/LanguageContext';

export default function MaintenanceScreen({ onRetry, retrying }) {
  const { t, isRTL } = useLang();

  return (
    <div
      className="maintenance-screen flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-6 py-16"
      style={{
        background: 'var(--cream)',
        color: 'var(--black)',
        fontFamily: isRTL ? 'Tajawal, sans-serif' : 'Jost, system-ui, sans-serif',
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-md text-center">
        <p
          className="mb-3 text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: 'var(--warm-gray)' }}
        >
          {t.maintenance.kicker}
        </p>
        <h1
          className="mb-4 text-3xl font-medium sm:text-4xl"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {t.maintenance.title}
        </h1>
        <p className="mb-10 text-base font-light leading-relaxed" style={{ color: 'var(--warm-gray)' }}>
          {t.maintenance.body}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex min-h-[44px] min-w-[160px] items-center justify-center rounded-sm px-8 text-sm font-medium uppercase tracking-wider text-white transition-opacity disabled:opacity-50"
            style={{ background: 'var(--gold)' }}
          >
            {retrying ? t.common.loading : t.maintenance.retry}
          </button>
        ) : null}
      </div>
    </div>
  );
}
