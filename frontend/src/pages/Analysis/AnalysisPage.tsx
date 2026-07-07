import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE, flagFor, type RaceEntry, type CalendarResponse } from '../../lib/f1';
import { useToast } from '../../components/Toast';
import { driversManifestUrl, lapsUrl, type DriverManifest, type SessionLaps } from '../../lib/telemetry';
import TelemetryComparison from './components/TelemetryComparison';
import TrackDominance from './components/TrackDominance';
import LapSimulation from './components/LapSimulation';
import PositionChart from './components/PositionChart';
import LapTimes from './components/LapTimes';
import TyreStrategy from './components/TyreStrategy';

// UI session codes. Q1/Q2/Q3 are virtual — they all read the real 'Q' session's
// data but filter each driver's lap to that qualifying segment.
type SessionCode = 'FP1' | 'FP2' | 'FP3' | 'SQ' | 'S' | 'Q' | 'Q1' | 'Q2' | 'Q3' | 'R';
type ApiSession = 'FP1' | 'FP2' | 'FP3' | 'SQ' | 'S' | 'Q' | 'R';
const ALL_SESSIONS: { code: SessionCode; label: string; sprintOnly?: boolean; indent?: boolean }[] = [
  { code: 'R', label: 'Race' },
  { code: 'Q1', label: 'Qualifying Q1' },
  { code: 'Q2', label: 'Qualifying Q2' },
  { code: 'Q3', label: 'Qualifying Q3' },
  { code: 'SQ', label: 'Sprint Qualifying', sprintOnly: true },
  { code: 'S', label: 'Sprint', sprintOnly: true },
  { code: 'FP1', label: 'Practice 1' },
  { code: 'FP2', label: 'Practice 2' },
  { code: 'FP3', label: 'Practice 3' },
];

// Map a UI session to the backend session + qualifying segment filter.
function resolveSession(s: SessionCode): { api: ApiSession; segment: number | null } {
  if (s === 'Q1') return { api: 'Q', segment: 1 };
  if (s === 'Q2') return { api: 'Q', segment: 2 };
  if (s === 'Q3') return { api: 'Q', segment: 3 };
  return { api: s as ApiSession, segment: null };
}

type Mode = 'comparison' | 'dominance' | 'simulation' | 'positions' | 'laptimes' | 'tyre';
const MODES: { key: Mode; label: string; sub: string; needsDrivers: boolean }[] = [
  { key: 'comparison', label: 'Telemetry', sub: 'Speed · Throttle · Brake', needsDrivers: true },
  { key: 'dominance', label: 'Track Dominance', sub: 'Who’s faster, where', needsDrivers: true },
  { key: 'simulation', label: 'Lap Sim', sub: 'Ghost-car replay', needsDrivers: true },
  { key: 'laptimes', label: 'Lap Times', sub: 'Pace through the race', needsDrivers: true },
  { key: 'positions', label: 'Positions', sub: 'Lap-by-lap classification', needsDrivers: false },
  { key: 'tyre', label: 'Tyre Strategy', sub: 'Stints · Degradation', needsDrivers: true },
];

type ManifestState = DriverManifest | 'loading' | 'missing' | 'error';

export default function AnalysisPage() {
  const { raceId = '' } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const { showError } = useToast();

  const year = raceId.split('_')[0];

  const [race, setRace] = useState<RaceEntry | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionCode>('R'); // race is the default landing view
  const [mode, setMode] = useState<Mode>('comparison');

  const [manifest, setManifest] = useState<ManifestState>('loading');
  const [generating, setGenerating] = useState(false);
  // For quali sessions: the session-wide lap table, used both to check whether
  // Q1/Q2/Q3 segment tags exist (older caches don't — route through generate)
  // and to filter the driver picker down to that segment's actual survivors.
  const [sessionLaps, setSessionLaps] = useState<SessionLaps | null>(null);
  const [segmentsReady, setSegmentsReady] = useState<boolean | null>(null);

  const [selected, setSelected] = useState<string[]>([]);
  // Manual per-driver color picks (driver code -> hex), overriding team color.
  // Kept for the whole page session so switching modes/sessions doesn't lose it.
  const [colorOverrides, setColorOverrides] = useState<Record<string, string>>({});

  // Resolve raceId -> race meta from the season calendar (same pattern as RaceDetail).
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/season/${year}/calendar`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Season calendar unavailable')))
      .then((cal: CalendarResponse) => {
        if (cancelled) return;
        const found = cal.races.find(r => r.race_id === raceId);
        if (!found) { setMetaError('Race not found'); return; }
        setRace(found);
      })
      .catch(e => { if (!cancelled) setMetaError(e.message); });
    return () => { cancelled = true; };
  }, [raceId, year]);

  const resolvedRace = race && race.race_id === raceId ? race : null;

  // Backend session + qualifying-segment filter derived from the UI session code.
  const { api: apiSession, segment } = resolveSession(session);

  // Only offer Sprint / Sprint Qualifying on weekends that actually run a sprint.
  // (has_sprint may be absent on older calendar caches — treat absent as "show all".)
  const sessions = useMemo(() => {
    const allowSprint = resolvedRace?.has_sprint ?? true;
    return ALL_SESSIONS.filter(s => allowSprint || !s.sprintOnly);
  }, [resolvedRace]);

  // If the current session got filtered out (e.g. switched to a non-sprint race), fall back to Race.
  useEffect(() => {
    if (!sessions.some(s => s.code === session)) setSession('Q');
  }, [sessions, session]);

  const loadManifest = useMemo(() => (r: RaceEntry, api: ApiSession) => {
    setManifest('loading');
    fetch(driversManifestUrl(year, r.name, api))
      .then(res => {
        if (res.status === 404) return 'missing' as const;
        if (!res.ok) return 'error' as const;
        return res.json();
      })
      .then(data => {
        if (data === 'missing' || data === 'error') { setManifest(data); return; }
        setManifest(data.drivers as DriverManifest);
      })
      .catch(() => setManifest('error'));
  }, [year]);

  useEffect(() => {
    if (!resolvedRace) return;
    loadManifest(resolvedRace, apiSession);
  }, [resolvedRace, apiSession, loadManifest]);

  // For quali sessions, verify the cached data carries Q1/Q2/Q3 segment tags. If not
  // (older cache), we route the user through the generate flow to backfill them.
  const isQualiApi = apiSession === 'Q' || apiSession === 'SQ';
  useEffect(() => {
    if (!resolvedRace || !isQualiApi || typeof manifest !== 'object') { setSegmentsReady(null); setSessionLaps(null); return; }
    let cancelled = false;
    setSegmentsReady(null);
    fetch(lapsUrl(year, resolvedRace.name, apiSession))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((laps: SessionLaps) => {
        if (cancelled) return;
        setSessionLaps(laps);
        setSegmentsReady(Object.values(laps).some(d => d.laps.some(l => l.segment != null)));
      })
      .catch(() => { if (!cancelled) { setSegmentsReady(false); setSessionLaps(null); } });
    return () => { cancelled = true; };
  }, [resolvedRace, apiSession, isQualiApi, manifest, year]);

  // Which drivers actually have a lap tagged with the current Q1/Q2/Q3 segment —
  // e.g. only the top-10 have a Q3 lap. Undefined (no filter) outside quali.
  const segmentDriverCodes = useMemo<Set<string> | null>(() => {
    if (segment == null || !sessionLaps) return null;
    const codes = Object.keys(sessionLaps).filter(c => sessionLaps[c].laps.some(l => l.segment === segment));
    return new Set(codes);
  }, [segment, sessionLaps]);

  // Default selection to a single driver — the race winner (pole sitter for quali).
  // When a Q1/Q2/Q3 segment is active, only pick from that segment's actual
  // survivors (e.g. never default to a driver knocked out before Q3).
  useEffect(() => {
    if (typeof manifest !== 'object') return;
    let entries = Object.entries(manifest);
    if (segmentDriverCodes) entries = entries.filter(([c]) => segmentDriverCodes.has(c));
    if (entries.length === 0) return;
    setSelected(prev => {
      const stillValid = prev.filter(c => manifest[c] && (!segmentDriverCodes || segmentDriverCodes.has(c)));
      if (stillValid.length > 0) return stillValid;
      // Race/Sprint: match the calendar winner's full name to a driver code.
      if ((apiSession === 'R' || apiSession === 'S') && resolvedRace?.winner) {
        const w = entries.find(([, e]) => e.full_name === resolvedRace.winner);
        if (w) return [w[0]];
      }
      // Otherwise the fastest driver (pole for quali).
      const byPace = entries
        .filter(([, e]) => e.fastest_lap?.lap_time_s != null)
        .sort((a, b) => (a[1].fastest_lap!.lap_time_s! - b[1].fastest_lap!.lap_time_s!));
      const first = (byPace[0] ?? entries[0])[0];
      return [first];
    });
  }, [manifest, apiSession, resolvedRace, segmentDriverCodes]);

  const generate = async () => {
    if (!resolvedRace) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/races/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, gp: resolvedRace.name, session: apiSession }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate analysis data');
      loadManifest(resolvedRace, apiSession);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to generate analysis data');
    } finally {
      setGenerating(false);
    }
  };

  if (metaError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] gap-3">
        <div className="text-[#e10600] font-mono text-sm">⚠️ {metaError}</div>
        <button onClick={() => navigate('/events')} className="text-xs text-gray-500 hover:text-white transition-colors">← Back to Calendar</button>
      </div>
    );
  }

  if (!resolvedRace) {
    return (
      <div className="min-h-screen bg-[#050505] pt-10 pb-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="h-[120px] rounded-2xl bg-[#0d0e12] border border-white/5 animate-pulse mb-6" />
          <div className="h-[500px] rounded-2xl bg-[#0d0e12] border border-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  const manifestReady = typeof manifest === 'object';
  const needsSegmentRegen = manifestReady && isQualiApi && segmentsReady === false;
  const activeMode = MODES.find(m => m.key === mode)!;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-10 pb-20 font-sans">
      <div className="max-w-[1200px] mx-auto px-6">
        <button onClick={() => navigate(`/races/${raceId}`)} className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
          Back to results
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-1">{year} · Round {resolvedRace.round} · Analytics</p>
            <h1 className="text-2xl md:text-3xl font-black italic tracking-tight uppercase flex items-center gap-3">
              {flagFor(resolvedRace.country)} {resolvedRace.name}
            </h1>
          </div>
          <SessionDropdown current={session} onChange={setSession} sessions={sessions} />
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-4 py-2.5 rounded-xl border text-left transition-all ${
                mode === m.key ? 'bg-[#e10600]/12 border-[#e10600]/40' : 'bg-[#0d0e12] border-white/8 hover:border-white/20'
              }`}
            >
              <div className={`text-xs font-bold uppercase tracking-wide ${mode === m.key ? 'text-white' : 'text-gray-300'}`}>{m.label}</div>
              <div className="text-[10px] text-gray-500">{m.sub}</div>
            </button>
          ))}
        </div>

        {/* Body */}
        {manifest === 'loading' && <PanelSkeleton />}

        {manifest === 'error' && (
          <EmptyPanel title="Couldn't load analysis data" sub="The backend may be unreachable, or this session failed to generate." />
        )}

        {/* Waiting on the quali segment-availability check before deciding what to show. */}
        {manifestReady && isQualiApi && segmentsReady === null && <PanelSkeleton />}

        {(manifest === 'missing' || needsSegmentRegen) && (
          <div className="rounded-2xl bg-[#0d0e12] border border-white/5 py-16 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="text-3xl">📊</div>
            <div>
              <div className="text-gray-200 font-bold">
                {needsSegmentRegen ? 'Q1/Q2/Q3 breakdown not available yet' : 'No analysis data for this session yet'}
              </div>
              <div className="text-gray-500 text-xs font-mono mt-1">
                {needsSegmentRegen
                  ? 'This session was cached before segment data existed — regenerate to unlock Q1/Q2/Q3.'
                  : "Generate it from FastF1 — this runs once, then it's cached."}
              </div>
            </div>
            <button
              onClick={generate}
              disabled={generating}
              className={`flex items-center gap-2 h-11 px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                generating ? 'bg-[#e10600]/60 text-white cursor-wait' : 'bg-[#e10600] text-white hover:bg-[#ff1a12] shadow-[0_0_20px_rgba(225,6,0,0.25)]'
              }`}
            >
              {generating ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating… (may take a minute)</>
              ) : needsSegmentRegen ? 'Regenerate for Q1/Q2/Q3' : 'Generate analysis'}
            </button>
          </div>
        )}

        {manifestReady && !needsSegmentRegen && !(isQualiApi && segmentsReady === null) && (
          <>
            {activeMode.needsDrivers && (
              <>
                <MultiDriverPicker manifest={manifest} selected={selected} onChange={setSelected} availableCodes={segmentDriverCodes}
                  colorOverrides={colorOverrides} onColorChange={(code, color) => setColorOverrides(prev => {
                    if (color === null) { const next = { ...prev }; delete next[code]; return next; }
                    return { ...prev, [code]: color };
                  })} />
                <p className="text-[10px] text-gray-600 font-mono mt-2">Tip: click the color swatch next to a selected driver to recolor them everywhere on this page.</p>
              </>
            )}
            <div className="mt-5">
              {activeMode.needsDrivers && selected.length === 0 ? (
                <EmptyPanel title="Add a driver" sub="Use the picker above to add one or more drivers." />
              ) : mode === 'comparison' ? (
                <TelemetryComparison year={year} gp={resolvedRace.name} session={apiSession} segment={segment} drivers={selected} manifest={manifest} colorOverrides={colorOverrides} />
              ) : mode === 'dominance' ? (
                <TrackDominance year={year} gp={resolvedRace.name} session={apiSession} segment={segment} drivers={selected} manifest={manifest} colorOverrides={colorOverrides} />
              ) : mode === 'simulation' ? (
                <LapSimulation year={year} gp={resolvedRace.name} session={apiSession} segment={segment} drivers={selected} manifest={manifest} colorOverrides={colorOverrides} />
              ) : mode === 'positions' ? (
                <PositionChart year={year} gp={resolvedRace.name} session={apiSession} manifest={manifest} highlighted={selected} />
              ) : mode === 'laptimes' ? (
                <LapTimes year={year} gp={resolvedRace.name} session={apiSession} drivers={selected} manifest={manifest} colorOverrides={colorOverrides} />
              ) : (
                <TyreStrategy year={year} gp={resolvedRace.name} session={apiSession} drivers={selected} manifest={manifest} colorOverrides={colorOverrides} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── controls ─────────────────────────────────────────────────────────────────

function SessionDropdown({ current, onChange, sessions }: { current: SessionCode; onChange: (s: SessionCode) => void; sessions: { code: SessionCode; label: string; indent?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = sessions.find(s => s.code === current) ?? sessions[0];
  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#0d0e12] border border-white/10 hover:border-white/20 text-sm font-mono font-bold text-gray-200 transition-colors">
        {selected.label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}><path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 max-h-80 overflow-y-auto rounded-xl bg-[#0d0e12] border border-white/10 shadow-2xl z-20">
          {sessions.map(s => (
            <button key={s.code} onClick={() => { onChange(s.code); setOpen(false); }}
              className={`w-full text-left py-2.5 text-sm font-mono flex items-center justify-between transition-colors ${s.indent ? 'pl-8 pr-4' : 'px-4'}`}
              style={{ color: s.code === current ? '#e10600' : 'rgba(255,255,255,0.6)', background: s.code === current ? 'rgba(225,6,0,0.06)' : 'transparent' }}>
              {s.label}{s.code === current && <span className="text-[8px]">●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Removable chips for selected drivers + a checkbox dropdown to toggle any
 * number of drivers in one open session (no repeated "Add" clicks). Lists
 * "ABBR (Full Name)"; works for one driver, a pair, or a larger group. */
function MultiDriverPicker({ manifest, selected, onChange, availableCodes, colorOverrides, onColorChange }: {
  manifest: DriverManifest; selected: string[]; onChange: (codes: string[]) => void;
  availableCodes?: Set<string> | null; // e.g. only Q3's top-10 survivors — null/undefined means everyone
  colorOverrides: Record<string, string>;
  onColorChange: (code: string, color: string | null) => void; // null clears back to the team color
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const options = useMemo(
    () => Object.entries(manifest)
      .filter(([code]) => !availableCodes || availableCodes.has(code))
      .sort((a, b) => a[1].full_name.localeCompare(b[1].full_name)),
    [manifest, availableCodes],
  );

  const remove = (code: string) => onChange(selected.filter(c => c !== code));
  const toggle = (code: string) =>
    onChange(selected.includes(code) ? selected.filter(c => c !== code) : [...selected, code]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {selected.map(code => {
        const e = manifest[code];
        const current = colorOverrides[code] ?? e?.team_color ?? '#555555';
        const isOverridden = code in colorOverrides;
        return (
          <div key={code} className="flex items-center gap-2 h-11 pl-2.5 pr-2 rounded-xl bg-[#0d0e12] border border-white/10">
            <label title="Click to change this driver's color" className="relative w-4 h-6 shrink-0 cursor-pointer">
              <input type="color" value={current} onChange={(ev) => onColorChange(code, ev.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <span className="block w-1 h-6 rounded-full" style={{ background: current }} />
            </label>
            {isOverridden && (
              <button onClick={() => onColorChange(code, null)} aria-label={`Reset ${code} color`} title="Reset to team color"
                className="text-[9px] text-gray-500 hover:text-white transition-colors -ml-1">↺</button>
            )}
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-white">{code}</span>
              <span className="text-[10px] text-gray-500 -mt-0.5">{e?.full_name}</span>
            </span>
            <button onClick={() => remove(code)} aria-label={`Remove ${code}`}
              className="ml-1 w-5 h-5 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
              ✕
            </button>
          </div>
        );
      })}

      <div ref={ref} className="relative">
        <button onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 h-11 px-3.5 rounded-xl border border-dashed border-white/15 hover:border-white/35 text-gray-400 hover:text-white transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          <span className="text-xs font-bold uppercase tracking-wide">{selected.length ? 'Drivers' : 'Add drivers'}</span>
        </button>
        {open && (
          <div className="absolute left-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-xl bg-[#0d0e12] border border-white/10 shadow-2xl z-30 py-1">
            {options.map(([code, e]) => {
              const on = selected.includes(code);
              return (
                <button key={code} onClick={() => toggle(code)}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-white/5 transition-colors">
                  <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${on ? 'bg-[#e10600] border-[#e10600]' : 'border-white/25'}`}>
                    {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><path d="M20 6 9 17l-5-5" /></svg>}
                  </span>
                  <span className="w-1 h-5 rounded-full shrink-0" style={{ background: e.team_color }} />
                  <span className="text-sm">
                    <span className="font-bold text-white">{code}</span>
                    <span className="text-gray-500"> ({e.full_name})</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return <div className="rounded-2xl bg-[#0d0e12] border border-white/5 h-[480px] animate-pulse" />;
}

function EmptyPanel({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 py-20 flex flex-col items-center justify-center gap-2">
      <div className="text-gray-400 font-bold text-sm">{title}</div>
      <div className="text-gray-600 text-xs font-mono">{sub}</div>
    </div>
  );
}
