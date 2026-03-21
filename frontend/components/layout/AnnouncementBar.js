import { useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const [msgIdx, setMsgIdx] = useState(0);
  const { isRTL } = useLang();

  const messages = isRTL
    ? [
        'التوصيل لبغداد و5 محافظات',
        'وصلت مجموعات جديدة كل أسبوع',
        'للطلب راسلينا عبر الدايركت على إنستغرام',
      ]
    : [
        'Delivery to Baghdad & 5 provinces',
        'New collections arrive every week',
        'Order via Instagram DM — @yf14_store',
      ];

  if (!visible) return null;

  const prev = () => setMsgIdx(i => (i - 1 + messages.length) % messages.length);
  const next = () => setMsgIdx(i => (i + 1) % messages.length);

  return (
    <div className="h-9 w-full max-w-full min-w-0 overflow-x-clip flex shrink-0 items-center justify-between bg-gradient-to-r from-[#8b2be2] via-[#7c3aed] to-[#8b2be2] px-4 md:px-8">
      <button
        onClick={isRTL ? next : prev}
        className="text-white/70 hover:text-white transition-colors w-5 text-sm leading-none"
        aria-label="Previous"
      >
        ←
      </button>

      <p className="text-[11px] tracking-widest text-white/95 uppercase font-body text-center flex-1 px-4 truncate">
        {messages[msgIdx]}
      </p>

      <button
        onClick={isRTL ? prev : next}
        className="text-white/70 hover:text-white transition-colors w-5 text-sm leading-none"
        aria-label="Next"
      >
        →
      </button>
    </div>
  );
}
