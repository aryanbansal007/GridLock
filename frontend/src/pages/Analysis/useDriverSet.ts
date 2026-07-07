import { useEffect, useRef, useState } from 'react';
import { driverDataUrl, type DriverTelemetry } from '../../lib/telemetry';

interface SetState {
  drivers: Record<string, DriverTelemetry>;
  loading: boolean;
  error: string | null;
}

// Fetches per-driver telemetry files for an arbitrary number of selected drivers
// (1 to N). Browser caches the GET responses, so switching modes doesn't re-download.
//
// Keeps the PREVIOUS result visible while a new fetch is in flight (instead of
// clearing to a blank/loading state on every add/remove) — local cached files
// resolve in milliseconds, so clearing first caused a full unmount→skeleton→
// remount "flash" every time a driver was toggled. `loading` is only true for
// the genuine first-ever fetch (nothing to show yet) or when the race/session
// context itself changes (old data would be misleading to keep on screen then).
export function useDriverSet(year: string, gp: string, session: string, codes: string[]): SetState {
  const key = codes.join(',');
  const contextKey = `${year}|${gp}|${session}`;
  const [state, setState] = useState<SetState>({ drivers: {}, loading: codes.length > 0, error: null });
  const hasLoadedOnce = useRef(false);
  const prevContext = useRef(contextKey);

  useEffect(() => {
    const contextChanged = prevContext.current !== contextKey;
    prevContext.current = contextKey;
    if (contextChanged) hasLoadedOnce.current = false;

    if (codes.length === 0) {
      setState({ drivers: {}, loading: false, error: null });
      hasLoadedOnce.current = false;
      return;
    }

    let cancelled = false;
    setState(prev => ({
      drivers: contextChanged ? {} : prev.drivers,
      loading: !hasLoadedOnce.current,
      error: null,
    }));

    Promise.all(
      codes.map(code =>
        fetch(driverDataUrl(year, gp, session, code))
          .then(r => r.ok ? r.json() : Promise.reject(new Error(`No data for ${code}`)))
          .then((d: DriverTelemetry) => [code, d] as const),
      ),
    )
      .then(pairs => {
        if (cancelled) return;
        const drivers: Record<string, DriverTelemetry> = {};
        for (const [code, d] of pairs) drivers[code] = d;
        hasLoadedOnce.current = true;
        setState({ drivers, loading: false, error: null });
      })
      .catch((e: Error) => { if (!cancelled) setState({ drivers: {}, loading: false, error: e.message }); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, gp, session, key, contextKey]);

  return state;
}
