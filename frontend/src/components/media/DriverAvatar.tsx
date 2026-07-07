import { useState } from 'react';
import { driverInitials } from '../../lib/f1';

// Driver portrait with graceful fallback to an initials chip in the team colour.
// Photos are external (Wikipedia) so they can occasionally fail — never show a broken image.
// A team-color ring + soft glow gives every photo a consistent "branded card" frame no matter
// how differently each source photo is lit/composed, and a slight zoom keeps faces reading at
// a uniform scale across photos with varying amounts of headroom.
export function DriverAvatar({
  src, name, teamColor, size = 44, rounded = 'full', className = '',
}: {
  src?: string;
  name: string;
  teamColor: string;
  size?: number;
  rounded?: 'full' | 'lg';
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const radius = rounded === 'full' ? '9999px' : '12px';
  const showPhoto = src && !failed;
  const color = `#${teamColor}`;

  return (
    <div
      className={className}
      style={{
        width: size, height: size, borderRadius: radius, flexShrink: 0, overflow: 'hidden',
        background: showPhoto ? '#15161a' : color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        boxShadow: showPhoto
          ? `0 0 0 2px ${color}66, inset 0 0 0 1px rgba(255,255,255,0.08), 0 6px 18px -6px ${color}80`
          : undefined,
      }}
    >
      {showPhoto ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', transform: 'scale(1.08)' }}
        />
      ) : (
        <span style={{ fontSize: size * 0.36, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          {driverInitials(name)}
        </span>
      )}
    </div>
  );
}
