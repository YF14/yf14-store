import { useLang } from '../../contexts/LanguageContext';

function Sep() {
  return <span className="hidden sm:block w-px h-4 bg-white/15 flex-shrink-0" aria-hidden />;
}

export default function DeliveryStrip() {
  const { t } = useLang();
  const h = t.home;

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-clip bg-nav-navy border-y border-white/[0.06]">
      <div className="container-luxury py-3 md:py-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 sm:gap-x-8 text-[11px] md:text-xs text-white/70 font-body">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-brand-purple flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
            />
          </svg>
          <span>
            <strong className="text-[#a78bfa] font-medium">{h.deliveryStripNextDay}</strong>{' '}
            {h.deliveryStripEverywhere}
          </span>
        </div>
        <Sep />
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-brand-purple flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {h.deliveryStripOrderBefore}{' '}
            <strong className="text-[#a78bfa] font-medium">{h.deliveryStripCutoff}</strong>{' '}
            {h.deliveryStripArrives}
          </span>
        </div>
        <Sep />
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-brand-purple flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong className="text-[#a78bfa] font-medium">{h.deliveryStripFee}</strong>{' '}
            {h.deliveryStripFlatFee}
          </span>
        </div>
        <Sep />
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-brand-purple flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v15A2.25 2.25 0 004.5 19.5z" />
          </svg>
          <span>
            <strong className="text-[#a78bfa] font-medium">{h.deliveryStripCash}</strong>{' '}
            {h.deliveryStripCod}
          </span>
        </div>
      </div>
    </div>
  );
}
