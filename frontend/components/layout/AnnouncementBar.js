import { useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const [msgIdx, setMsgIdx] = useState(0);
  const { isRTL } = useLang();

  const messages = isRTL
    ? [
        '🚚 التوصيل لبغداد و5 محافظات',
        '✨ وصلت مجموعات جديدة كل أسبوع',
        '💜 للطلب راسلينا عبر الدايركت على إنستغرام',
      ]
    : [
        '🚚 Delivery to Baghdad & 5 provinces',
        '✨ New collections arrive every week',
        '💜 Order via Instagram DM @yf14_store',
      ];

  if (!visible) return null;

  return (
    <div
      className="text-white text-center py-2.5 px-4 text-xs font-medium relative"
      style={{ background: 'linear-gradient(135deg, #7e22ce, #9333ea, #db2777)' }}
    >
      <button
        onClick={() => setMsgIdx((i) => (i + 1) % messages.length)}
        className="hover:text-white/80 transition-colors"
      >
        {messages[msgIdx]}
      </button>
      <button
        onClick={() => setVisible(false)}
        className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors text-base leading-none`}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
