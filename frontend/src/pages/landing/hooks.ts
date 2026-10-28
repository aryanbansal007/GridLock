import { useCallback, useEffect, useRef, useState } from 'react';
import { SNAP } from './data';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** True once the element has scrolled into view (and, with `track`, while it stays there). */
export function useInView<T extends Element>(options: { track?: boolean; margin?: string } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const { track = false, margin = '0px 0px -10% 0px' } = options;
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        if (!track) io.disconnect();
      } else if (track) {
        setInView(false);
      }
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [track, margin]);
  return { ref, inView };
}

const FRAMES = SNAP.replay.cars[0].cd.length;

/**
 * Plays the snapshot's one lap of real car positions. Runs only while `active` (on screen)
 * and playing; with reduced motion it starts paused, so nothing moves unless asked to.
 * `frame` is fractional so markers interpolate between the 0.6s source frames.
 */
export function useReplay(active: boolean, speed = 4) {
  const reduced = usePrefersReducedMotion();
  // null = follow the motion preference; a click records an explicit choice.
  const [choice, setPlaying] = useState<boolean | null>(null);
  const playing = choice ?? !reduced;
  const [frame, setFrame] = useState(FRAMES * 0.18);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !playing) { last.current = null; return; }
    const tick = (now: number) => {
      if (last.current != null) {
        const dt = (now - last.current) / 1000;
        setFrame((f) => (f + (dt * speed) / SNAP.replay.step) % (FRAMES - 1));
      }
      last.current = now;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      last.current = null;
    };
  }, [active, playing, speed]);

  const seek = useCallback((f: number) => setFrame(Math.max(0, Math.min(FRAMES - 1.001, f))), []);
  return { frame, playing, setPlaying, seek, frames: FRAMES };
}

/** Car position at a fractional frame, interpolated between the stored frames. */
export function carAt(xy: number[], frame: number): [number, number] {
  const i = Math.floor(frame);
  const f = frame - i;
  const j = Math.min(i + 1, xy.length / 2 - 1);
  return [xy[i * 2] + (xy[j * 2] - xy[i * 2]) * f, xy[i * 2 + 1] + (xy[j * 2 + 1] - xy[i * 2 + 1]) * f];
}

/**
 * Running order and intervals at a frame. The interval is the real time the car behind
 * took to reach the distance the car ahead has covered now, read from the stored series.
 */
export function orderAt(frame: number) {
  const i = Math.floor(frame);
  const cars = SNAP.replay.cars
    .map((c) => ({ ...c, d: c.cd[i] + (c.cd[Math.min(i + 1, c.cd.length - 1)] - c.cd[i]) * (frame - i) }))
    .sort((a, b) => b.d - a.d);
  return cars.map((c, k) => {
    if (k === 0) return { code: c.code, color: c.color, compound: c.compound, interval: null as number | null };
    const target = cars[k - 1].d;
    let j = i;
    while (j < c.cd.length - 1 && c.cd[j + 1] < target) j++;
    let interval: number | null = null;
    if (j < c.cd.length - 1) {
      const span = c.cd[j + 1] - c.cd[j] || 1;
      interval = (j - frame + (target - c.cd[j]) / span) * SNAP.replay.step;
      if (interval < 0) interval = 0;
    }
    return { code: c.code, color: c.color, compound: c.compound, interval };
  });
}
