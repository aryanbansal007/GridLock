import { useState } from 'react';

// Circuit photo with a graceful fallback to a track-line motif rather than a broken-image glyph.
export function CircuitImage({ src, alt, className, style }: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        className={className}
        style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)' }}
      >
        <svg width="40%" height="40%" viewBox="0 0 100 100" style={{ opacity: 0.18 }} fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M10 70 Q 30 20, 55 40 T 90 30" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={className} style={style} onError={() => setFailed(true)} />;
}
