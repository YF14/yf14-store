import { useState } from 'react';

const messages = [
  'Free shipping on orders over $100',
  'New arrivals every Friday',
  'Use code WELCOME15 for 15% off your first order',
];

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const [msgIdx, setMsgIdx] = useState(0);

  if (!visible) return null;

  return (
    <div className="bg-brand-black text-white text-center py-2.5 px-4 text-xs tracking-widest uppercase font-medium relative">
      <button
        onClick={() => setMsgIdx((i) => (i + 1) % messages.length)}
        className="hover:text-brand-gold transition-colors"
      >
        {messages[msgIdx]}
      </button>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
