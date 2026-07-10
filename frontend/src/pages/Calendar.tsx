import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  API_BASE, SEASON_YEAR, flagFor, fmtWeekendRange, shortName,
  type CalendarResponse, type RaceEntry,
} from '../lib/f1';
import { CircuitImage } from '../components/media/CircuitImage';
import { SeasonSelector } from '../components/SeasonSelector';

export default function Calendar() {
  const navigate = useNavigate();
  // Year lives in the URL (not plain useState) so it survives navigating away to a
  // race and back — otherwise every remount reset to SEASON_YEAR regardless of what
  // the user was actually browsing.
  const [searchParams, setSearchParams] = useSearchParams();
  const yearParam = Number(searchParams.get('year'));
  const currentYear = yearParam || SEASON_YEAR;
  const setCurrentYear = (y: number) => setSearchParams(y === SEASON_YEAR ? {} : { year: String(y) });
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetch(`${API_BASE}/api/season/${currentYear}/calendar`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`Failed to load ${currentYear} calendar`)))
      .then(j => { if (!cancelled) setData(j); })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [currentYear]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const races = useMemo(() => data?.races ?? [], [data]);
  // Cancelled races were never actually rounds of the season, so they're excluded
  // from both sides of the "X / Y Rounds Complete" count (matches how the official
  // calendar itself dropped them rather than counting them as scheduled rounds).
  const scheduledRaces = races.filter(r => r.status !== 'cancelled');
  const completed = scheduledRaces.filter(r => r.status === 'completed').length;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] gap-3">
        <div className="text-[#e10600] font-mono text-sm">⚠️ Connection Lost</div>
        <div className="text-sm text-gray-500 font-mono">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-10 pb-20 font-sans">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">Full Season</p>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tight uppercase">{currentYear} Race Calendar</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-[#0d0e12] border border-white/10 text-xs font-mono font-bold text-gray-300">
              {completed} / {scheduledRaces.length} Rounds Complete
            </div>
            <SeasonSelector currentYear={currentYear} onChange={setCurrentYear} />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {races.map((r, i) => (
            <RaceCard key={r.race_id} race={r} index={i} mounted={mounted} onOpen={() => navigate(`/races/${r.race_id}`)} />
          ))}
          {races.length === 0 && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[220px] rounded-2xl bg-[#0d0e12] border border-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: RaceEntry['status'] }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-green-400">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
        Completed
      </span>
    );
  }
  if (status === 'ongoing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[#e10600]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e10600] opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#e10600]" />
        </span>
        Live Now
      </span>
    );
  }
  if (status === 'cancelled') {
    return <span className="text-[10px] font-bold tracking-widest uppercase text-gray-600">Cancelled</span>;
  }
  return <span className="text-[10px] font-bold tracking-widest uppercase text-sky-400/80">Upcoming</span>;
}

function RaceCard({ race, index, mounted, onOpen }: { race: RaceEntry; index: number; mounted: boolean; onOpen: () => void }) {
  const clickable = race.status === 'completed' || race.status === 'ongoing';

  return (
    <button
      onClick={clickable ? onOpen : undefined}
      disabled={!clickable}
      className={`group relative text-left rounded-2xl overflow-hidden bg-[#0d0e12] border border-white/5 transition-all duration-500 ${clickable ? 'hover:border-white/20 hover:-translate-y-1 cursor-pointer' : 'cursor-default'}`}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(14px)',
        transitionDelay: `${Math.min(index * 40, 400)}ms`,
      }}
    >
      {/* Photo header */}
      <div className="relative h-[130px] overflow-hidden">
        <CircuitImage
          src={race.image_url}
          alt={race.circuit}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ opacity: race.status === 'cancelled' ? 0.25 : 0.75 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/30 to-transparent" />
        {/* Round + weekend-format badges */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {race.has_sprint && (
            <div className="px-2 py-1 rounded-md bg-[#e10600]/80 backdrop-blur-sm border border-[#e10600]/40 text-[9px] font-black tracking-widest text-white uppercase">
              Sprint
            </div>
          )}
          {/* Cancelled races never got a real RoundNumber from FastF1 — the
              round field here is just a fractional sort key, not a round to show. */}
          {race.status !== 'cancelled' && (
            <div className="px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm border border-white/10 text-[10px] font-bold tracking-widest text-white uppercase">
              Round {race.round}
            </div>
          )}
        </div>
        {/* Flag + name */}
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg leading-none">{flagFor(race.country)}</span>
            <h3 className="text-base font-bold tracking-tight truncate">{shortName(race.name)}</h3>
          </div>
          <p className="text-[11px] text-gray-400 font-medium truncate pl-7">{race.circuit}</p>
        </div>
      </div>

      {/* Meta row */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {fmtWeekendRange(race.weekend_start, race.date)}
        </div>
        <StatusBadge status={race.status} />
      </div>

      {/* Winner strip (completed) or cancelled note */}
      {race.status === 'cancelled' ? (
        <div className="px-4 pb-4 -mt-1 flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Race Cancelled</span>
        </div>
      ) : race.winner ? (
        <div className="px-4 pb-4 -mt-1 flex items-center gap-2">
          <span className="text-sm">🏆</span>
          <span className="text-xs font-bold text-white">{race.winner}</span>
          <span className="text-[11px] font-semibold" style={{ color: race.winner_team === 'Ferrari' ? '#e8002d' : 'rgba(255,255,255,0.4)' }}>
            {race.winner_team}
          </span>
        </div>
      ) : (
        <div className="px-4 pb-4 -mt-1 text-[11px] text-gray-600 font-mono">Awaiting lights out</div>
      )}

      {/* Team-color accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px] transition-opacity duration-300"
        style={{
          background: race.status === 'ongoing' ? '#e10600' : race.status === 'completed' ? '#22c55e' : 'rgba(255,255,255,0.08)',
          opacity: race.status === 'upcoming' ? 0.4 : 1,
        }}
      />
    </button>
  );
}
