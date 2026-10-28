/**
 * Overhead view of a pit box: a modern F1 car, nose to the right, under a single garage
 * light, with painted box lines on an epoxy floor. Pure SVG, so the hero never waits on
 * (or breaks over) an image request and scales crisply at any size.
 */
export function GarageScene({ className = '', viewBox = '0 -40 1200 800' }: { className?: string; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <radialGradient id="gl-light" cx="58%" cy="50%" r="55%">
          <stop offset="0" stopColor="#2a2d33" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#15171b" stopOpacity="0.9" />
          <stop offset="1" stopColor="#050505" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="gl-redglow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#E10600" stopOpacity="0.22" />
          <stop offset="1" stopColor="#E10600" stopOpacity="0" />
        </radialGradient>
        <pattern id="gl-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#ffffff" strokeOpacity="0.035" strokeWidth="1" />
        </pattern>
        <filter id="gl-blur-lg" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      {/* Floor, light pool and a faint engineering grid */}
      <rect width="1200" height="760" fill="url(#gl-light)" />
      <rect width="1200" height="760" fill="url(#gl-grid)" />
      <ellipse cx="810" cy="420" rx="420" ry="170" fill="url(#gl-redglow)" />

      {/* Pit box markings */}
      <g opacity="0.55">
        <rect x="470" y="250" width="700" height="350" fill="none" stroke="#d9d9d9" strokeOpacity="0.35" strokeWidth="6" />
        <line x1="470" y1="425" x2="520" y2="425" stroke="#d9d9d9" strokeOpacity="0.35" strokeWidth="6" />
        <line x1="1120" y1="425" x2="1170" y2="425" stroke="#d9d9d9" strokeOpacity="0.35" strokeWidth="6" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => (
          <rect key={i} x={470 + i * 50} y={600} width={25} height={10} fill="#E10600" fillOpacity="0.55" />
        ))}
        <text
          x="820" y="575" textAnchor="middle" fill="#ffffff" fillOpacity="0.07"
          fontSize="64" fontWeight="900" letterSpacing="18"
          fontFamily='"JetBrains Mono","SFMono-Regular",Menlo,monospace'
        >
          GRIDLOCK
        </text>
      </g>

      {/* Car, centred in the box */}
      <g transform="translate(505 300) scale(1.06)">
        <ellipse cx="320" cy="136" rx="300" ry="96" fill="#000" opacity="0.65" filter="url(#gl-blur-lg)" />
        <TopDownCar />
      </g>

      {/* Overhead fixture reflection */}
      <rect x="560" y="120" width="420" height="6" rx="3" fill="#ffffff" opacity="0.06" />
    </svg>
  );
}

/** Top-down F1 car, nose pointing right, in a 640×260 box. */
export function TopDownCar() {
  return (
    <g>
      <defs>
        <linearGradient id="gl-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#101216" />
          <stop offset="0.42" stopColor="#3b4049" />
          <stop offset="0.5" stopColor="#4a505b" />
          <stop offset="0.58" stopColor="#3b4049" />
          <stop offset="1" stopColor="#0e1013" />
        </linearGradient>
        <linearGradient id="gl-pod" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d0f12" />
          <stop offset="0.3" stopColor="#2a2e35" />
          <stop offset="0.5" stopColor="#1a1d22" />
          <stop offset="0.7" stopColor="#2a2e35" />
          <stop offset="1" stopColor="#0d0f12" />
        </linearGradient>
        <linearGradient id="gl-tyre" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#050505" />
          <stop offset="0.5" stopColor="#24262b" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <linearGradient id="gl-wing" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1b1e23" />
          <stop offset="0.5" stopColor="#3a3f48" />
          <stop offset="1" stopColor="#15171b" />
        </linearGradient>
      </defs>

      {/* Floor plank and edges */}
      <path d="M150 58 L392 64 Q410 66 414 84 L414 176 Q410 194 392 196 L150 202 Q132 200 128 184 L128 76 Q132 60 150 58Z" fill="#060607" stroke="#1d2025" strokeWidth="1.5" />

      {/* Rear suspension */}
      <g stroke="#3a3f48" strokeWidth="3" strokeLinecap="round">
        <line x1="112" y1="56" x2="168" y2="110" /><line x1="124" y1="56" x2="190" y2="114" />
        <line x1="112" y1="204" x2="168" y2="150" /><line x1="124" y1="204" x2="190" y2="146" />
      </g>
      {/* Front suspension */}
      <g stroke="#3a3f48" strokeWidth="3" strokeLinecap="round">
        <line x1="470" y1="58" x2="428" y2="112" /><line x1="474" y1="58" x2="500" y2="116" />
        <line x1="470" y1="202" x2="428" y2="148" /><line x1="474" y1="202" x2="500" y2="144" />
      </g>

      {/* Tyres */}
      <Tyre x={68} y={20} w={86} h={50} />
      <Tyre x={68} y={190} w={86} h={50} />
      <Tyre x={434} y={30} w={78} h={42} />
      <Tyre x={434} y={188} w={78} h={42} />

      {/* Rear wing and beam wing */}
      <rect x="22" y="58" width="44" height="144" rx="3" fill="url(#gl-wing)" stroke="#2b2f36" />
      <rect x="40" y="62" width="6" height="136" fill="#E10600" opacity="0.85" />
      <rect x="18" y="54" width="52" height="10" rx="2" fill="#E10600" />
      <rect x="18" y="196" width="52" height="10" rx="2" fill="#E10600" />

      {/* Engine cover */}
      <path d="M304 100 C262 96 204 100 150 110 L112 120 L112 140 L150 150 C204 160 262 164 304 160 Z" fill="url(#gl-body)" stroke="#0a0b0d" strokeWidth="1.5" />

      {/* Sidepods with undercut */}
      <path d="M334 96 C324 70 302 62 272 60 L214 64 C198 68 188 82 182 100 L182 160 C188 178 198 192 214 196 L272 200 C302 198 324 190 334 164 Z" fill="url(#gl-pod)" stroke="#0a0b0d" strokeWidth="1.5" />
      <rect x="326" y="68" width="8" height="26" rx="3" fill="#050505" />
      <rect x="326" y="166" width="8" height="26" rx="3" fill="#050505" />
      <path d="M236 70 L300 70" stroke="#E10600" strokeWidth="3" opacity="0.9" />
      <path d="M236 190 L300 190" stroke="#E10600" strokeWidth="3" opacity="0.9" />

      {/* Monocoque */}
      <path d="M262 98 C318 92 382 98 414 110 L414 150 C382 162 318 168 262 162 Z" fill="url(#gl-body)" stroke="#0a0b0d" strokeWidth="1.5" />

      {/* Nose */}
      <path d="M404 110 C468 114 540 120 592 125 Q602 130 592 135 C540 140 468 146 404 150 Z" fill="url(#gl-body)" stroke="#0a0b0d" strokeWidth="1.5" />

      {/* Front wing */}
      <path d="M566 40 h28 l16 14 v152 l-16 14 h-28 q10 -90 0 -180z" fill="url(#gl-wing)" stroke="#2b2f36" />
      <rect x="560" y="34" width="52" height="9" rx="2" fill="#E10600" />
      <rect x="560" y="217" width="52" height="9" rx="2" fill="#E10600" />

      {/* Centre-line livery stripe */}
      <path d="M140 128 L590 128 L590 132 L140 132 Z" fill="#E10600" opacity="0.9" />

      {/* Airbox, cockpit, helmet, halo */}
      <ellipse cx="290" cy="130" rx="12" ry="9" fill="#050505" />
      <ellipse cx="340" cy="130" rx="30" ry="15" fill="#050505" />
      <circle cx="336" cy="130" r="10" fill="#d9d9d9" />
      <path d="M330 125 h10 v10 h-10z" fill="#E10600" opacity="0.9" />
      <path d="M312 116 Q366 110 372 130 Q366 150 312 144" fill="none" stroke="#5a606b" strokeWidth="4" strokeLinecap="round" />
      <line x1="372" y1="130" x2="392" y2="130" stroke="#5a606b" strokeWidth="4" strokeLinecap="round" />

      {/* Overhead light catching the bodywork */}
      <path d="M160 126 L400 122" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" />
    </g>
  );
}

function Tyre({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={9} fill="url(#gl-tyre)" stroke="#000" />
      <rect x={x + 6} y={y + h / 2 - 1.5} width={w - 12} height={3} fill="#E10600" opacity="0.55" />
    </g>
  );
}
