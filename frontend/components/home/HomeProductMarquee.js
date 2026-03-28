import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'react-query';
import api from '../../lib/api';
import { useLang } from '../../contexts/LanguageContext';
import { formatIQD } from '../../lib/currency';
import { pickListingImageUrl, pickListingVideoUrl } from '../../lib/productMedia';

function MarqueeCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef(null);
  const primaryImg = pickListingImageUrl(product);
  const videoUrl = pickListingVideoUrl(product);
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleMouseEnter = () => {
    setHovered(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (videoRef.current) videoRef.current.pause();
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group flex-shrink-0 w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] rounded-xl overflow-hidden relative bg-[#0f0f1a] block ring-1 ring-white/10 hover:ring-[#c084fc]/30 transition-all duration-300"
    >
      <div className="absolute inset-0">
        {primaryImg ? (
          <Image
            src={primaryImg}
            alt={product.name}
            fill
            className={`object-contain transition-all duration-500 ${
              hovered && videoUrl
                ? 'opacity-0'
                : videoUrl
                ? 'scale-100 opacity-100'
                : 'group-hover:scale-[1.04] opacity-100'
            }`}
            sizes="200px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#2a1f3d] to-[#0f0f1a]" />
        )}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
              hovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>
      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-[2]">
        {discount > 0 && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#db2777] text-white">
            −{discount}%
          </span>
        )}
        {product.isNewArrival && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#1a1a2e] text-[#d4a0dc]">
            New
          </span>
        )}
        {product.isBestSeller && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#a855c8] text-[#fdf0ff]">
            Best seller
          </span>
        )}
        {videoUrl && (
          <span className="text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">▶ Video</span>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-[2] pt-10 pb-2.5 px-2.5 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
        <p className="text-white text-xs font-medium line-clamp-2 leading-snug mb-0.5 group-hover:text-[#e9d5ff] transition-colors">
          {product.name}
        </p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[11px] text-white/80 font-medium">{formatIQD(product.price)}</span>
          {product.comparePrice > product.price && (
            <span className="text-[10px] text-white/40 line-through">{formatIQD(product.comparePrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function HomeProductMarquee() {
  const { t } = useLang();
  const h = t.home;
  const s = t.shop;

  const { data, isLoading } = useQuery(['home-marquee-products', 'featured'], () =>
    api
      .get('/products?filter=featured&sort=featuredSortOrder&page=1&limit=24')
      .then((r) => r.data)
  );

  const products = data?.products || [];
  const total = data?.total ?? 0;
  const loop = products.length ? [...products, ...products] : [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-5 md:mb-6">
        <div>
          <p className="text-[11px] tracking-[0.1em] uppercase text-[#d4a0dc] font-body mb-1.5">
            {h.heroSeason}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-[2.25rem] font-medium text-[#f5f3ff] leading-[1.1]">
            <span className="block">{h.heroTitle}</span>
            <span className="block text-[#f472b6] italic font-medium">{h.heroTitleEm}</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {total > 0 && (
            <span className="text-xs text-[#6b6b8a] font-body tracking-wide">
              {h.heroPieces.replace('{n}', String(total))}
            </span>
          )}
          <Link
            href="/featured"
            className="inline-flex items-center rounded-lg bg-[#a855c8] px-5 py-2.5 text-xs font-body text-[#fdf0ff] tracking-wide hover:bg-[#9333b8] transition-colors shadow-sm"
          >
            {h.shopAllCta}
          </Link>
        </div>
      </div>

      <div className="relative max-w-full overflow-x-clip overflow-y-visible">
        {isLoading ? (
          <div className="flex gap-3 max-w-full overflow-x-clip">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[170px] h-[240px] rounded-xl overflow-hidden">
                <div className="w-full h-full rounded-xl bg-white/[0.08] animate-pulse" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-white/40 py-10 text-sm">{s.noPiecesFound}</p>
        ) : (
          <div className="max-w-full overflow-x-clip py-1 [contain:inline-size]" dir="ltr">
            <div className="flex w-max gap-3 animate-marquee-home hover:[animation-play-state:paused] will-change-transform">
              {loop.map((p, i) => (
                <MarqueeCard key={`${p._id}-${i}`} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
