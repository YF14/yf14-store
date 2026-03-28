import { forwardRef, useEffect, useRef, useCallback } from 'react';

/**
 * Plays MP4/WebM/blob URLs natively; Cloudflare Stream and other HLS sources via hls.js (Chrome/Firefox).
 * Forwards ref to the underlying video element (play/pause/currentTime).
 */
const HlsVideo = forwardRef(function HlsVideo({ src, poster, className, ...rest }, ref) {
  const innerRef = useRef(null);

  const setRefs = useCallback(
    (el) => {
      innerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref]
  );

  useEffect(() => {
    const video = innerRef.current;
    if (!video || !src) return undefined;

    const isBlob = src.startsWith('blob:') || src.startsWith('data:');
    const isHls =
      !isBlob && (/\.m3u8(\?|$)/i.test(src) || /\/manifest\/video\.m3u8/i.test(src));

    if (!isHls) {
      video.src = src;
      return () => {
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return () => {
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }

    let hlsInstance = null;
    let cancelled = false;

    import('hls.js').then(({ default: Hls }) => {
      if (cancelled || !innerRef.current) return;
      const v = innerRef.current;
      if (Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true, maxBufferLength: 30 });
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(v);
      }
    });

    return () => {
      cancelled = true;
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [src]);

  return <video ref={setRefs} poster={poster} className={className} {...rest} />;
});

export default HlsVideo;
