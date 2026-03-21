import { useRef, useCallback, useEffect } from 'react';

/**
 * Renders a muted video tile that shows a visible frame (not a black first frame).
 */
export default function VideoPreviewThumb({ src, className = '' }) {
  const videoRef = useRef(null);
  const paintedRef = useRef(false);

  useEffect(() => {
    paintedRef.current = false;
  }, [src]);

  const paintFirstFrame = useCallback(() => {
    if (paintedRef.current) return;
    const v = videoRef.current;
    if (!v) return;
    const dur = v.duration;
    if (!Number.isFinite(dur) || dur <= 0) return;
    paintedRef.current = true;
    const done = () => {
      v.pause();
      v.removeEventListener('seeked', done);
    };
    v.addEventListener('seeked', done, { once: true });
    try {
      const t = Math.min(0.2, Math.max(0.05, dur * 0.02));
      v.currentTime = t;
    } catch {
      v.currentTime = 0;
    }
  }, []);

  return (
    <video
      key={src}
      ref={videoRef}
      src={src}
      className={className}
      muted
      playsInline
      preload="auto"
      onLoadedData={paintFirstFrame}
      onLoadedMetadata={paintFirstFrame}
    />
  );
}
