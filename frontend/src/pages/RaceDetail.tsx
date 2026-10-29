import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE, flagFor, fmtDateFull, findRaceById, type RaceEntry, type CalendarResponse, seasonUrl, sessionResultsUrl, usingObjectStorage } from '../lib/f1';
import { CircuitImage } from '../components/media/CircuitImage';
import { DriverAvatar } from '../components/media/DriverAvatar';
import { useToast } from '../components/Toast';
import { Kicker, Watermark, DriverPhoto } from '../components/standings/parts';
import { MEDAL, rise } from '../components/standings/tokens';

type SessionCode = 'FP1' | 'FP2' | 'FP3' | 'SQ' | 'S' | 'Q' | 'R';
const SESSIONS: { code: SessionCode; label: string; short: string }[] = [
  { code: 'FP1', label: 'Practice 1', short: 'FP1' },
  { code: 'FP2', label: 'Practice 2', short: 'FP2' },
  { code: 'FP3', label: 'Practice 3', short: 'FP3' },
  { code: 'SQ', label: 'Sprint Qualifying', short: 'Sprint Quali' },
  { code: 'S', label: 'Sprint', short: 'Sprint' },
  { code: 'Q', label: 'Qualifying', short: 'Quali' },
  { code: 'R', label: 'Race', short: 'Race' },
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

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
};

/** Places gained from the grid to the flag (positive = moved up). */
const posDelta = (grid?: number | null, finish?: number | null) => (!grid || !finish ? null : grid - finish);

const isRetired = (status?: string) => !!status && !/^(finished|lapped|\+\d+ laps?)$/i.test(status.trim());

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
    fetch(seasonUrl(year, 'calendar'))
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Season calendar unavailable')))
      .then((cal: CalendarResponse) => {
        if (cancelled) return;
        const found = findRaceById(cal.races, raceId);
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
    fetch(sessionResultsUrl(year, resolvedRace.round, session))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: SessionResultsResponse) => { if (!cancelled) setCache(prev => ({ ...prev, [key]: data })); })
      .catch(() => { if (!cancelled) setCache(prev => ({ ...prev, [key]: 'error' })); });
    return () => { cancelled = true; };
  }, [resolvedRace, session, year, cache, raceId]);

  const current = cache[`${raceId}:${session}`];

  // Session results carry no photos; the season standings do, keyed by driver code. A
  // bundled local photo still wins over these (see useDriverImage).
  const [photos, setPhotos] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    fetch(seasonUrl(year, 'standings'))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: { drivers?: { abbreviation: string; image_url?: string }[] }) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const x of d.drivers ?? []) if (x.image_url) map[x.abbreviation] = x.image_url;
        setPhotos(map);
      })
      .catch(() => { /* photos are decoration; fall back to initials */ });
    return () => { cancelled = true; };
  }, [year]);

  if (raceMetaError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#050505]">
        <div className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-[#e10600]">{raceMetaError}</div>
        <button onClick={() => navigate(`/events?year=${year}`)} className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-400 transition-colors hover:text-white">← Back to calendar</button>
      </div>
    );
  }

  if (!resolvedRace) {
    return (
      <div className="min-h-screen bg-[#050505] pb-20 pt-8">
        <div className="mx-auto max-w-[1240px] space-y-4 px-5 sm:px-8">
          <div className="h-[240px] animate-pulse border border-[#1A1C20] bg-[#0B0D10]" />
          <div className="h-[46px] animate-pulse border border-[#1A1C20] bg-[#0B0D10]" />
          <div className="h-[420px] animate-pulse border border-[#1A1C20] bg-[#0B0D10]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-20 pt-6 font-sans text-[#F5F5F5]">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <button onClick={() => navigate(`/events?year=${year}`)} className="mb-4 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A7ACB6] transition-colors hover:text-[#F5F5F5]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="m15 18-6-6 6-6" /></svg>
          Calendar
        </button>

        <RaceHeader race={resolvedRace} year={year} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <SessionTabs current={session} onChange={setSession} raceStatus={resolvedRace.status} hasSprint={resolvedRace.has_sprint ?? true} />
          <div className="flex items-center gap-2">
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
            <Classification session={session} data={current} photos={photos} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────

function RaceHeader({ race, year }: { race: RaceEntry; year: string }) {
  return (
    <header className="relative isolate overflow-hidden border border-[#24262B]">
      <CircuitImage src={race.image_url} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#050505_8%,#050505cc_45%,#05050566_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-[#050505] to-transparent" />
      <Watermark className="-bottom-8 right-4 hidden text-[15rem] sm:block">{String(race.round).padStart(2, '0')}</Watermark>

      <div className="flex min-h-[210px] flex-col justify-end gap-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Kicker>{year} season · round {race.round}</Kicker>
          <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${race.has_sprint ? 'text-[#FF2D24]' : 'text-[#A7ACB6]'}`}>
            {race.has_sprint ? 'Sprint weekend' : 'Standard weekend'}
          </span>
          {race.status === 'ongoing' && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF2D24]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E10600]" /> Live
            </span>
          )}
        </div>
        <div>
          <h1 className="flex items-center gap-3 text-[clamp(1.9rem,4.4vw,3.4rem)] font-black uppercase leading-[0.95] tracking-[-0.04em]">
            <span className="text-[0.7em]" aria-hidden>{flagFor(race.country)}</span>{race.name}
          </h1>
          <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[#C5C9D1]">{race.circuit} · {fmtDateFull(race.date)}</p>
        </div>
      </div>
    </header>
  );
}

// ─── Session tabs ───────────────────────────────────────────────────────────

function SessionTabs({ current, onChange, raceStatus, hasSprint }: { current: SessionCode; onChange: (s: SessionCode) => void; raceStatus: string; hasSprint: boolean }) {
  const disabled = raceStatus === 'upcoming';
  // Hide Sprint / Sprint Qualifying on standard (non-sprint) weekends.
  const visible = SESSIONS.filter((s) => hasSprint || (s.code !== 'S' && s.code !== 'SQ'));
  return (
    <div role="tablist" aria-label="Session" className="flex max-w-full overflow-x-auto border border-[#24262B] bg-[#0B0D10]">
      {visible.map((s) => {
        const active = s.code === current;
        return (
          <button
            key={s.code}
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(s.code)}
            className={`relative shrink-0 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#FF2D24] ${
              disabled ? 'cursor-not-allowed text-[#3a3d44]' : active ? 'bg-[#111318] text-[#F5F5F5]' : 'text-[#A7ACB6] hover:text-[#C9CCD1]'
            }`}
          >
            {s.short}
            {active && !disabled && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#E10600]" aria-hidden />}
          </button>
        );
      })}
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

    // See SimulatorSetup.launch — with data served from object storage the replay reads
    // its files straight from the bucket, so asking the API to generate first only adds
    // a 503 that blocks a session which is already published.
    if (usingObjectStorage()) {
      navigate(`/simulator/${race.race_id}_${session.toLowerCase()}`);
      setLoading(false);
      return;
    }

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
      className={`flex h-10 items-center gap-2 px-5 font-mono text-[11px] font-black uppercase tracking-[0.12em] transition-colors ${
        disabled ? 'cursor-not-allowed bg-[#111318] text-[#3a3d44]'
        : loading ? 'cursor-wait bg-[#E10600]/60 text-white'
        : 'bg-[#E10600] text-white hover:bg-[#FF2D24]'
      }`}
    >
      {loading ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Generating…
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
          Watch replay
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
      className={`flex h-10 items-center gap-2 border px-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
        disabled
          ? 'cursor-not-allowed border-[#1A1C20] text-[#3a3d44]'
          : 'border-[#24262B] bg-[#0B0D10] text-[#C9CCD1] hover:border-[#C5C9D1] hover:text-white'
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
      </svg>
      Analytics
    </button>
  );
}

// ─── Classification ─────────────────────────────────────────────────────────

function Classification({ session, data, photos }: { session: SessionCode; data: SessionResultsResponse; photos: Record<string, string> }) {
  const isRace = RACE_LIKE.has(session);
  const rows = data.results;
  const fastest = data.fastest_lap ?? null;

  const podium = useMemo(() => (isRace ? rows.filter((r) => r.position != null && r.position <= 3).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) : []), [isRace, rows]);
  const showPodium = podium.length === 3;
  const tableRows = showPodium ? rows.filter((r) => !podium.includes(r)) : rows;

  return (
    <div className="space-y-4">
      {isRace && showPodium && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-6" style={rise(0)}><PodiumLead row={podium[0]} src={photos[podium[0].abbreviation]} fastestAbbr={fastest?.abbreviation} /></div>
          <div className="grid gap-4 lg:col-span-6">
            {[podium[1], podium[2]].map((r, i) => (
              <div key={r.abbreviation} style={rise(i + 1)}><PodiumSide row={r} src={photos[r.abbreviation]} fastestAbbr={fastest?.abbreviation} /></div>
            ))}
          </div>
        </div>
      )}

      {isRace && <SummaryStrip rows={rows} fastest={fastest} />}

      <ResultsTable session={session} rows={tableRows} photos={photos} fastestAbbr={fastest?.abbreviation ?? null} />
    </div>
  );
}

function PodiumLead({ row: r, src, fastestAbbr }: { row: RaceResultRow; src?: string; fastestAbbr?: string }) {
  const color = `#${r.team_color}`;
  const { first, last } = splitName(r.driver);
  const gained = posDelta(r.grid, r.position);
  return (
    <div
      className="relative isolate flex h-full min-h-[300px] flex-col overflow-hidden border border-[#24262B] sm:min-h-[360px] sm:flex-row"
      style={{ background: `radial-gradient(120% 90% at 85% 0%, ${color}40 0%, transparent 60%), linear-gradient(180deg, #0D0F13, #090A0C)` }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: MEDAL[0] }} />
      <Watermark className="-bottom-4 -right-2 text-[10rem] sm:-bottom-8 sm:text-[17rem]">1</Watermark>
      <div className="relative z-10 flex flex-1 flex-col justify-between p-6 sm:max-w-[60%] sm:p-7">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: MEDAL[0] }}>▲ Race winner</div>
          <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#C5C9D1]">{first}</div>
          <h2 className="mt-0.5 font-black uppercase leading-[0.92] tracking-[-0.04em]" style={{ fontSize: `${last.length <= 7 ? 3 : last.length <= 10 ? 2.5 : 2.1}rem` }}>{last}</h2>
          <div className="mt-2.5 flex items-center gap-2.5 text-[13px] text-[#C9CCD1]">
            <span className="h-3 w-[3px]" style={{ background: color }} aria-hidden />{r.team}
          </div>
        </div>
        <div className="mt-7 grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
          <Fact label="Points" value={r.points ?? 0} />
          <Fact label="Started" value={r.grid ? `P${r.grid}` : '—'} />
          <Fact label="Gained" value={gained == null ? '—' : gained > 0 ? `+${gained}` : String(gained)} accent={gained != null && gained > 0 ? '#2EB84B' : undefined} />
        </div>
        {fastestAbbr === r.abbreviation && <FastestTag className="mt-3" />}
      </div>
      <div className="relative order-first h-52 sm:order-none sm:h-auto sm:flex-1">
        <div className="absolute inset-0 sm:[mask-image:linear-gradient(to_right,transparent,black_28%)]">
          <DriverPhoto name={r.driver} abbr={r.abbreviation} src={src} color={color} zoom={1.2} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#090A0C] to-transparent" />
      </div>
    </div>
  );
}

function PodiumSide({ row: r, src, fastestAbbr }: { row: RaceResultRow; src?: string; fastestAbbr?: string }) {
  const color = `#${r.team_color}`;
  const medal = MEDAL[(r.position ?? 3) - 1];
  const { first, last } = splitName(r.driver);
  const gained = posDelta(r.grid, r.position);
  return (
    <div
      className="relative isolate grid min-h-[170px] grid-cols-[minmax(7rem,0.75fr)_1.25fr] overflow-hidden border border-[#24262B]"
      style={{ background: `radial-gradient(110% 120% at 0% 0%, ${color}38 0%, transparent 60%), linear-gradient(180deg, #0D0F13, #090A0C)` }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: medal }} />
      <Watermark className="-bottom-4 right-1 text-[9rem]">{r.position}</Watermark>
      <div className="relative">
        <div className="absolute inset-0 [mask-image:linear-gradient(to_left,transparent,black_30%)]">
          <DriverPhoto name={r.driver} abbr={r.abbreviation} src={src} color={color} />
        </div>
        <span className="absolute left-3 top-3.5 font-mono text-[24px] font-black leading-none" style={{ color: medal }}>P{r.position}</span>
      </div>
      <div className="relative z-10 flex flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#C5C9D1]">{first}</div>
          <h3 className="font-black uppercase leading-[0.95] tracking-[-0.03em]" style={{ fontSize: `${last.length <= 7 ? 1.9 : last.length <= 10 ? 1.6 : 1.35}rem` }}>{last}</h3>
          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-[#C9CCD1]">
            <span className="h-2.5 w-[3px]" style={{ background: color }} aria-hidden /><span className="truncate">{r.team}</span>
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/10 pt-3">
          <div className="flex gap-5">
            <Fact label="Points" value={r.points ?? 0} />
            <Fact label="Started" value={r.grid ? `P${r.grid}` : '—'} />
            <Fact label="Gained" value={gained == null ? '—' : gained > 0 ? `+${gained}` : String(gained)} accent={gained != null && gained > 0 ? '#2EB84B' : gained != null && gained < 0 ? '#FF2D24' : undefined} />
          </div>
          {fastestAbbr === r.abbreviation && <FastestTag />}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A7ACB6]">{label}</span>
      <span className="font-mono text-[17px] font-black tabular-nums" style={{ color: accent }}>{value}</span>
    </div>
  );
}

function FastestTag({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 border border-[#a855f7]/40 bg-[#a855f7]/10 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#c084fc] ${className}`}>
      <span aria-hidden>⚡</span> Fastest lap
    </span>
  );
}

/** Four headline numbers for the race, all derived from the classification itself. */
function SummaryStrip({ rows, fastest }: { rows: RaceResultRow[]; fastest: FastestLap | null }) {
  const finishers = rows.filter((r) => !isRetired(r.status)).length;
  const retired = rows.length - finishers;
  let best: { row: RaceResultRow; gain: number } | null = null;
  for (const r of rows) {
    const g = posDelta(r.grid, r.position);
    if (g != null && g > 0 && (!best || g > best.gain)) best = { row: r, gain: g };
  }
  const fastRow = fastest ? rows.find((r) => r.abbreviation === fastest.abbreviation) : null;
  const items = [
    {
      label: 'Fastest lap',
      value: fastest?.lap_time ?? '—',
      sub: fastest ? `${fastRow ? splitName(fastRow.driver).last : fastest.abbreviation}${fastest.lap_number != null ? ` · lap ${fastest.lap_number}` : ''}` : '',
      color: '#c084fc',
    },
    {
      label: 'Biggest mover',
      value: best ? `+${best.gain}` : '—',
      sub: best ? `${splitName(best.row.driver).last} · P${best.row.grid} → P${best.row.position}` : '',
      color: '#2EB84B',
    },
    { label: 'Classified', value: `${finishers}/${rows.length}`, sub: 'drivers at the flag', color: undefined },
    { label: 'Retirements', value: String(retired), sub: retired ? 'did not finish' : 'a clean race', color: retired ? '#FF2D24' : undefined },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px border border-[#24262B] bg-[#24262B] lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="bg-[#0B0D10] px-4 py-3.5">
          <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A7ACB6]">{it.label}</dt>
          <dd className="mt-1 font-mono text-[22px] font-black leading-none tabular-nums" style={{ color: it.color }}>{it.value}</dd>
          <dd className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-[#A7ACB6]">{it.sub}</dd>
        </div>
      ))}
    </dl>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (!status) return null;
  const retired = isRetired(status);
  const lapped = /lapped|\+\d+ laps?/i.test(status);
  const tone = retired ? 'border-[#E10600]/40 text-[#FF2D24]' : lapped ? 'border-[#D97706]/40 text-[#F59E0B]' : 'border-[#24262B] text-[#C5C9D1]';
  return <span className={`inline-block border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] ${tone}`}>{status}</span>;
}

function ResultsTable({ session, rows, photos, fastestAbbr }: { session: SessionCode; rows: RaceResultRow[]; photos: Record<string, string>; fastestAbbr?: string | null }) {
  const isRace = RACE_LIKE.has(session);
  const isQuali = QUALI_LIKE.has(session);
  const isPractice = !isRace && !isQuali;

  // Phones show position, driver, change and points / the key time; wider screens add the rest.
  const cols = isRace
    ? 'grid-cols-[2rem_1fr_3rem_3.25rem] sm:grid-cols-[2.5rem_1fr_4rem_4rem_6.5rem_4rem]'
    : isQuali
      ? 'grid-cols-[2rem_1fr_6rem] sm:grid-cols-[2.5rem_1fr_6rem_6rem_6rem]'
      : 'grid-cols-[2rem_1fr_6rem] sm:grid-cols-[2.5rem_1fr_8rem]';

  if (!rows.length) return null;

  return (
    <div className="border border-[#24262B] bg-[#0B0D10]">
      <div className={`grid ${cols} items-center gap-3 border-b border-[#24262B] px-4 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A7ACB6]`}>
        <span className="text-center">Pos</span>
        <span>Driver</span>
        {isRace && <><span className="hidden text-right sm:block">Grid</span><span className="text-right">+/−</span><span className="hidden text-right sm:block">Status</span><span className="text-right">Pts</span></>}
        {isQuali && <><span className="hidden text-right sm:block">Q1</span><span className="hidden text-right sm:block">Q2</span><span className="text-right">Q3</span></>}
        {isPractice && <span className="text-right">Best lap</span>}
      </div>
      {rows.map((row, i) => {
        const delta = isRace ? posDelta(row.grid, row.position) : null;
        const out = isRace && isRetired(row.status);
        const color = `#${row.team_color}`;
        const { first, last } = splitName(row.driver);
        const quali3 = row.q3 ?? row.q2 ?? row.q1 ?? '—';
        return (
          <div
            key={row.abbreviation + i}
            className={`group relative grid ${cols} items-center gap-3 border-b border-[#14161A] px-4 py-2.5 transition-colors last:border-b-0 hover:bg-[#111318] ${out ? 'opacity-70' : ''}`}
            style={rise(i + 3)}
          >
            <span className="absolute inset-y-0 left-0 w-[3px] opacity-70 transition-opacity group-hover:opacity-100" style={{ background: color }} aria-hidden />
            <span className="text-center font-mono text-[15px] font-black tabular-nums text-[#A7ACB6] transition-colors group-hover:text-[#F5F5F5]">{row.position ?? '—'}</span>
            <div className="flex min-w-0 items-center gap-3">
              <DriverAvatar src={photos[row.abbreviation]} name={row.driver} abbr={row.abbreviation} teamColor={row.team_color} size={36} />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[#A7ACB6] sm:inline">{first}</span>
                  <span className="truncate text-[15px] font-black uppercase tracking-[-0.01em]">{last}</span>
                  {fastestAbbr === row.abbreviation && <span title="Fastest lap" className="text-[#c084fc]" aria-label="Fastest lap">⚡</span>}
                  {isQuali && row.position === 1 && <span className="border border-[#FFD700]/40 px-1 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#FFD700]">Pole</span>}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#C5C9D1]">
                  <span className="truncate">{row.team}</span>
                  {isRace && out && <span className="sm:hidden"><StatusPill status={row.status} /></span>}
                </div>
              </div>
            </div>
            {isRace && (
              <>
                <span className="hidden text-right font-mono text-[14px] tabular-nums text-[#C9CCD1] sm:block">{row.grid ?? '—'}</span>
                <span className="text-right font-mono text-[13px] font-bold tabular-nums" style={{ color: delta === null || delta === 0 ? '#A7ACB6' : delta > 0 ? '#2EB84B' : '#FF2D24' }}>
                  {delta === null ? '—' : delta === 0 ? '=' : delta > 0 ? `▲${delta}` : `▼${-delta}`}
                </span>
                <span className="hidden text-right sm:block"><StatusPill status={row.status} /></span>
                <span className="text-right font-mono text-[16px] font-black tabular-nums">{row.points ? row.points : <span className="text-[#3a3d44]">·</span>}</span>
              </>
            )}
            {isQuali && (
              <>
                <span className="hidden text-right font-mono text-[13px] tabular-nums text-[#C5C9D1] sm:block">{row.q1 ?? '—'}</span>
                <span className="hidden text-right font-mono text-[13px] tabular-nums text-[#C5C9D1] sm:block">{row.q2 ?? '—'}</span>
                <span className="hidden text-right font-mono text-[14px] font-bold tabular-nums text-[#F5F5F5] sm:block">{row.q3 ?? '—'}</span>
                <span className="text-right font-mono text-[14px] font-bold tabular-nums text-[#F5F5F5] sm:hidden">{quali3}</span>
              </>
            )}
            {isPractice && <span className="text-right font-mono text-[14px] font-bold tabular-nums">{row.best_lap ?? '—'}</span>}
          </div>
        );
      })}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="h-[360px] animate-pulse border border-[#1A1C20] bg-[#0B0D10] lg:col-span-6" />
        <div className="grid gap-4 lg:col-span-6">
          <div className="h-[170px] animate-pulse border border-[#1A1C20] bg-[#0B0D10]" />
          <div className="h-[170px] animate-pulse border border-[#1A1C20] bg-[#0B0D10]" />
        </div>
      </div>
      <div className="space-y-px">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[56px] animate-pulse border border-[#1A1C20] bg-[#0B0D10]" />)}</div>
    </div>
  );
}

function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 border border-[#24262B] bg-[#0B0D10] py-20">
      <div className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-[#C5C9D1]">{title}</div>
      <div className="font-mono text-[11px] text-[#A7ACB6]">{sub}</div>
    </div>
  );
}
