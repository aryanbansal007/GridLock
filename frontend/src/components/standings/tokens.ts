import type { CSSProperties } from 'react';

export const MEDAL = ['#FFD700', '#C0C0C0', '#CD7F32'];

/** Staggered entrance; the keyframes live in index.css and are switched off for reduced motion. */
export const rise = (i: number): CSSProperties => ({
  animation: 'gl-rise 650ms cubic-bezier(0.2,0.7,0.2,1) both',
  animationDelay: `${Math.min(i, 14) * 45}ms`,
});
