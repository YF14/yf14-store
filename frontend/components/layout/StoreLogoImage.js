import Image from 'next/image';
import { useStoreLogoSrc } from '../../hooks/useStoreSettings';

/**
 * Navbar / footer logo: uses `GET /api/settings` (MongoDB + CDN URL) with static fallback.
 * With `fill`, use a square `relative rounded-full overflow-hidden` parent for a circular crop (no white ring).
 */
export default function StoreLogoImage({ className, width, height, sizes, priority, fill }) {
  const src = useStoreLogoSrc();
  if (fill) {
    return (
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className={className}
      />
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
