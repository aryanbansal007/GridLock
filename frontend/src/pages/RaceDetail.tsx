import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE, flagFor, fmtDateFull, type RaceEntry, type CalendarResponse } from '../lib/f1';
import { CircuitImage } from '../components/media/CircuitImage';
import { useToast } from '../components/Toast';

type SessionCode = 'FP1' | 'FP2' | 'FP3' | 'SQ' | 'S' | 'Q' | 'R';
const SESSIONS: { code: SessionCode; label: string }[] = [
  { code: 'FP1', label: 'Practice 1' },
  { code: 'FP2', label: 'Practice 2' },
  { code: 'FP3', label: 'Practice 3' },
  { code: 'SQ', label: 'Sprint Qualifying' },
  { code: 'S', label: 'Sprint' },
  { code: 'Q', label: 'Qualifying' },
  { code: 'R', label: 'Race' },
];

const RACE_LIKE = new Set<SessionCode>(['R', 'S']);
const QUALI_LIKE = new Set<SessionCode>(['Q', 'SQ']);

interface RaceResultRow {
  position: number | null;
  abbreviation: string;
  driver: string;
  team: string;
  team_color: string;
  status?: string;
  grid?: number | null;
  points?: number;
  q1?: string | null;
  q2?: string | null;
  q3?: string | null;
  best_lap?: string;
}
interface FastestLap {
  abbreviation: string;
  lap_time: string | null;
  lap_number: number | null;
}
interface SessionResultsResponse {
  year: number; round: number; session: string; event_name: string;
  results: RaceResultRow[];
  fastest_lap?: FastestLap | null;
}

export default function RaceDetail() {
  const { raceId = '' } = useParams<{ raceId: string }>();
  const navigate = useNavigate();

  const year = raceId.split('_')[0];

  const [race, setRace] = useState<RaceEntry | null>(null);
  const [raceMetaError, setRaceMetaError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionCode>('R');
  const [cache, setCache] = useState<Record<string, SessionResultsResponse | 'error'>>({});

  // Resolve race_id -> full race meta (round, name, circuit, status, image, winner).
  // `race` is guarded against staleness at render time (see `resolvedRace` below) rather
  // than cleared synchronously here, so navigating between two race pages never flashes
  // the previous race's data.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/season/${year}/calendar`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Season calendar unavailable')))
      .then((cal: CalendarResponse) => {
        if (cancelled) return;
        const found = cal.races.find(r => r.race_id === raceId);
        if (!found) { setRaceMetaError('Race not found'); return; }
        setRace(found);
        // Default to the most relevant session: Race if it's happened, else Qualifying
        setSession(found.status === 'completed' || found.status === 'ongoing' ? 'R' : 'Q');
      })
      .catch(e => { if (!cancelled) setRaceMetaError(e.message); });
    return () => { cancelled = true; };
  }, [raceId, year]);

  // Guard against staleness: if raceId just changed, `race` may still hold the previous
  // race until the effect above resolves — treat that as "still loading" rather than
  // clearing state synchronously in an effect.
  const resolvedRace = race && race.race_id === raceId ? race : null;

  // Fetch results for the selected session (cached per session for this page visit).
  // Absence from `cache` IS the loading state — nothing to write synchronously up front.
  useEffect(() => {
    if (!resolvedRace) return;
    if (resolvedRace.status === 'upcoming') return; // nothing to fetch — hasn't happened
    const key = `${raceId}:${session}`; // keyed by race too, so switching races can't show stale cached results
    if (cache[key] !== undefined) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/session-results/${year}/${resolvedRace.round}/${session}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: SessionResultsResponse) => { if (!cancelled) setCache(prev => ({ ...prev, [key]: data })); })
      .catch(() => { if (!cancelled) setCache(prev => ({ ...prev, [key]: 'error' })); });
    return () => { cancelled = true; };
  }, [resolvedRace, session, year, cache, raceId]);

  const current = cache[`${raceId}:${session}`];

  if (raceMetaError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] gap-3">
        <div className="text-[#e10600] font-mono text-sm">⚠️ {raceMetaError}</div>
        <button onClick={() => navigate(`/events?year=${year}`)} className="text-xs text-gray-500 hover:text-white transition-colors">← Back to Calendar</button>
      </div>
    );
  }

  if (!resolvedRace) {
    return (
      <div className="min-h-screen bg-[#050505] pt-10 pb-20">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="h-[220px] rounded-2xl bg-[#0d0e12] border border-white/5 animate-pulse mb-6" />
          <div className="h-[400px] rounded-2xl bg-[#0d0e12] border border-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-10 pb-20 font-sans">
      <div className="max-w-[1000px] mx-auto px-6">
        <button onClick={() => navigate(`/events?year=${year}`)} className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
          Back
        </button>

        <RaceHeader race={resolvedRace} year={year} />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <SessionSelector current={session} onChange={setSession} raceStatus={resolvedRace.status} hasSprint={resolvedRace.has_sprint ?? true} />
          <div className="flex items-center gap-2.5">
            <AnalyticsButton race={resolvedRace} />
            <SimulatorButton race={resolvedRace} year={year} session={session} />
          </div>
        </div>

        <div className="mt-4">
          {resolvedRace.status === 'upcoming' ? (
            <EmptyState title="This race hasn't happened yet" sub={`Check back after ${fmtDateFull(resolvedRace.date)}`} />
          ) : current === undefined ? (
            <SkeletonTable />
          ) : current === 'error' ? (
            <EmptyState title="Session data unavailable" sub="This session may not have data yet, or hasn't run." />
          ) : (
            <>
              <FastestLapBanner session={session} fastestLap={current.fastest_lap} />
              <ResultsTable session={session} rows={current.results} fastestLapAbbr={current.fastest_lap?.abbreviation ?? null} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RaceHeader({ race, year }: { race: RaceEntry; year: string }) {
  return (
    <div className="relative w-full h-[200px] rounded-2xl overflow-hidden border border-white/5">
      <CircuitImage src={race.image_url} alt={race.circuit} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.55 }} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c99] to-transparent" />
      <div className="relative z-10 h-full flex flex-col justify-end p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">{year} Season · Round {race.round}</span>
          <span className="text-white/20">·</span>
          <span className={`text-[10px] font-bold tracking-widest uppercase ${race.has_sprint ? 'text-[#e10600]' : 'text-gray-500'}`}>
            {race.has_sprint ? 'Sprint Weekend' : 'Standard Weekend'}
          </span>
          {race.status === 'ongoing' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#e10600]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e10600] animate-pulse" /> Live
            </span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-black italic tracking-tight uppercase flex items-center gap-3">
          {flagFor(race.country)} {race.name}
        </h1>
        <p className="text-sm text-gray-400 mt-1">{race.circuit} · {fmtDateFull(race.date)}</p>
        {race.winner && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-base">🏆</span>
            <span className="text-sm font-bold text-white">{race.winner}</span>
            <span className="text-xs font-semibold text-gray-400">{race.winner_team}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionSelector({ current, onChange, raceStatus, hasSprint }: { current: SessionCode; onChange: (s: SessionCode) => void; raceStatus: string; hasSprint: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const disabled = raceStatus === 'upcoming';

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Hide Sprint / Sprint Qualifying on standard (non-sprint) weekends.
  const visibleSessions = SESSIONS.filter(s => hasSprint || (s.code !== 'S' && s.code !== 'SQ'));
  const selected = visibleSessions.find(s => s.code === current) ?? visibleSessions[visibleSessions.length - 1];

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        className={`flex items-center gap-2 h-10 px-4 rounded-xl bg-[#0d0e12] border text-sm font-mono font-bold transition-colors ${
          disabled ? 'border-white/5 text-gray-700 cursor-not-allowed' : 'border-white/10 hover:border-white/20 text-gray-200'
        }`}
      >
        {selected.label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && !disabled && (
        <div className="absolute left-0 mt-2 w-52 max-h-80 overflow-y-auto rounded-xl bg-[#0d0e12] border border-white/10 shadow-2xl z-20">
          {visibleSessions.map(s => (
            <button
              key={s.code}
              onClick={() => { onChange(s.code); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm font-mono flex items-center justify-between transition-colors"
              style={{ color: s.code === current ? '#e10600' : 'rgba(255,255,255,0.6)', background: s.code === current ? 'rgba(225,6,0,0.06)' : 'transparent' }}
            >
              {s.label}{s.code === current && <span className="text-[8px]">●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SimulatorButton({ race, year, session }: { race: RaceEntry; year: string; session: SessionCode }) {
  const navigate = useNavigate();
  const { showError, showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const disabled = race.status === 'upcoming';

  const launch = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/races/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, gp: race.name, session }),
      });
      const data = await res.json();
      if (!res.ok) {
        // The backend explicitly refuses to generate (resource-constrained deploy,
        // race not pre-cached) — a calm, non-alarming notice, not an error.
        if (data.notAvailable) { showToast("This session hasn't been analyzed yet — check back soon.", 'info'); return; }
        throw new Error(data.error || 'Failed to generate telemetry');
      }
      navigate(`/simulator/${data.raceId}`);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to launch simulator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={launch}
      disabled={disabled || loading}
      title={disabled ? 'Available after the session runs' : undefined}
      className={`flex items-center gap-2 h-10 px-5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
        disabled ? 'bg-white/5 text-gray-600 cursor-not-allowed'
        : loading ? 'bg-[#e10600]/60 text-white cursor-wait'
        : 'bg-[#e10600] text-white hover:bg-[#ff1a12] shadow-[0_0_20px_rgba(225,6,0,0.25)]'
      }`}
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          Watch Race Simulator
        </>
      )}
    </button>
  );
}

function AnalyticsButton({ race }: { race: RaceEntry }) {
  const navigate = useNavigate();
  const disabled = race.status === 'upcoming';
  return (
    <button
      onClick={() => !disabled && navigate(`/analysis/${race.race_id}`)}
      disabled={disabled}
      title={disabled ? 'Available after the session runs' : 'Compare drivers: telemetry, lap sim, tyre strategy'}
      className={`flex items-center gap-2 h-10 px-5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
        disabled
          ? 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed'
          : 'bg-[#0d0e12] text-gray-200 border-white/10 hover:border-white/25 hover:text-white'
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
      </svg>
      Analytics
    </button>
  );
}

function FastestLapBanner({ session, fastestLap }: { session: SessionCode; fastestLap?: FastestLap | null }) {
  if (!RACE_LIKE.has(session) || !fastestLap) return null;
  return (
    <div className="mb-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/25">
      <span className="text-sm">⚡</span>
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#c084fc]">Fastest Lap</span>
      <span className="text-sm font-mono font-bold text-white">{fastestLap.abbreviation}</span>
      <span className="text-sm font-mono text-gray-400">{fastestLap.lap_time ?? '—'}</span>
      {fastestLap.lap_number != null && <span className="text-[11px] text-gray-500 font-mono">Lap {fastestLap.lap_number}</span>}
    </div>
  );
}

function posDelta(grid?: number | null, finish?: number | null) {
  if (!grid || !finish) return null;
  const delta = grid - finish; // positive = gained places
  return delta;
}

function ResultsTable({ session, rows, fastestLapAbbr }: { session: SessionCode; rows: RaceResultRow[]; fastestLapAbbr?: string | null }) {
  const isRace = RACE_LIKE.has(session);
  const isQuali = QUALI_LIKE.has(session);
  const isPractice = !isRace && !isQuali;

  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 overflow-hidden">
      <div className="grid gap-3 px-5 py-3 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-500"
        style={{ gridTemplateColumns: isRace ? '40px 1fr 70px 70px 90px 80px' : isQuali ? '40px 1fr 90px 90px 90px' : '40px 1fr 1fr' }}>
        <span>Pos</span>
        <span>Driver</span>
        {isRace && <><span className="text-right">Grid</span><span className="text-right">+/-</span><span className="text-right">Status</span><span className="text-right">Points</span></>}
        {isQuali && <><span className="text-right">Q1</span><span className="text-right">Q2</span><span className="text-right">Q3</span></>}
        {isPractice && <span className="text-right">Best Lap</span>}
      </div>
      <div className="divide-y divide-white/[0.04]">
        {rows.map((row, i) => {
          const delta = isRace ? posDelta(row.grid, row.position) : null;
          return (
            <div
              key={row.abbreviation + i}
              className="grid gap-3 px-5 py-3 items-center text-sm hover:bg-white/[0.02] transition-colors"
              style={{ gridTemplateColumns: isRace ? '40px 1fr 70px 70px 90px 80px' : isQuali ? '40px 1fr 90px 90px 90px' : '40px 1fr 1fr' }}
            >
              <span className="font-mono font-bold text-gray-400">{row.position ?? '—'}</span>
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-1 h-6 rounded-full shrink-0" style={{ background: `#${row.team_color}` }} />
                <div className="min-w-0">
                  <div className="font-bold truncate flex items-center gap-1.5">
                    {row.driver}
                    {fastestLapAbbr && row.abbreviation === fastestLapAbbr && <span title="Fastest Lap" className="text-[#c084fc]">⚡</span>}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">{row.team}</div>
                </div>
              </div>
              {isRace && (
                <>
                  <span className="text-right font-mono text-gray-400">{row.grid ?? '—'}</span>
                  <span className="text-right font-mono font-bold" style={{ color: delta === null || delta === 0 ? 'rgba(255,255,255,0.3)' : delta > 0 ? '#22c55e' : '#e10600' }}>
                    {delta === null ? '—' : delta === 0 ? '=' : delta > 0 ? `+${delta}` : delta}
                  </span>
                  <span className="text-right text-[11px] text-gray-400 truncate">{row.status}</span>
                  <span className="text-right font-mono font-black">{row.points ? row.points : ''}</span>
                </>
              )}
              {isQuali && (
                <>
                  <span className="text-right font-mono text-gray-300">{row.q1 ?? '—'}</span>
                  <span className="text-right font-mono text-gray-300">{row.q2 ?? '—'}</span>
                  <span className="text-right font-mono font-bold text-white">{row.q3 ?? '—'}</span>
                </>
              )}
              {isPractice && <span className="text-right font-mono font-bold text-white">{row.best_lap ?? '—'}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-5 space-y-3">
      {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-10 rounded-lg bg-white/[0.03] animate-pulse" />)}
    </div>
  );
}

function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 py-20 flex flex-col items-center justify-center gap-2">
      <div className="text-gray-400 font-bold text-sm">{title}</div>
      <div className="text-gray-600 text-xs font-mono">{sub}</div>
    </div>
  );
}
