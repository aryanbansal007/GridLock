import { useMemo, useState, type SyntheticEvent } from 'react';
import { localDriverPhoto } from '../../lib/driverPhotos';

/**
 * Picks the best available photo for a driver: a bundled local file first, then the
 * remote (Wikipedia) URL from the standings data, then nothing (callers draw initials).
 * A source that fails to load is skipped and the next one tried.
 *
 * `cutout` is true when the picture has transparent corners — a studio cut-out that
 * should stand on the card — as opposed to a rectangular photo that should fill it. It is
 * read from the pixels once the image has loaded; remote images are cross-origin and
 * can't be read, so they are treated as rectangular photos.
 */
export function useDriverImage(opts: { abbr?: string; name: string; number?: string | number; src?: string }) {
  const { abbr, name, number, src } = opts;
  const candidates = useMemo(() => {
    const local = localDriverPhoto({ abbr, name, number });
    return [local, src].filter((u, i, a): u is string => !!u && a.indexOf(u) === i);
  }, [abbr, name, number, src]);

  const [failed, setFailed] = useState<Record<string, true>>({});
  const [cutouts, setCutouts] = useState<Record<string, boolean>>({});
  const url = candidates.find((c) => !failed[c]);

  return {
    url,
    cutout: url ? !!cutouts[url] : false,
    onError: () => { if (url) setFailed((f) => ({ ...f, [url]: true })); },
    onLoad: (e: SyntheticEvent<HTMLImageElement>) => {
      if (!url) return;
      const img = e.currentTarget;
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 24;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 24, 24);
        const alpha = (x: number, y: number) => ctx.getImageData(x, y, 1, 1).data[3];
        const transparent = [alpha(0, 0), alpha(23, 0), alpha(0, 23), alpha(23, 23)].filter((a) => a < 200).length;
        setCutouts((m) => ({ ...m, [url]: transparent >= 3 }));
      } catch {
        // cross-origin image: pixels unreadable, keep the default (rectangular photo)
      }
    },
  };
}
