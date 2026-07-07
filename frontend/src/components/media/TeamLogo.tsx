import { useState } from 'react';

// Team logo as a solid team-color circle badge with a white silhouette of the
// crest on top (matches the reference look: a colored disc, not a white tile).
// `src` is expected to point at a white-on-transparent silhouette asset — see
// TEAM_LOGOS in lib/f1.ts. Falls back to the team's initials in white on that
// same colored disc if the logo is missing or fails to load.
export function TeamLogo({
  src, name, color, size = 40, className = '',
}: { src?: string; name: string; color: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const showLogo = src && !failed;
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div
      className={className}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `#${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: showLogo ? size * 0.24 : 0, overflow: 'hidden',
      }}
    >
      {showLogo ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <span style={{ fontSize: size * 0.34, fontWeight: 800, color: '#fff' }}>{initials}</span>
      )}
    </div>
  );
}
