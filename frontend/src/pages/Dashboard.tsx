import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  API_BASE, SEASON_YEAR, flagFor, pad, shortName, fmtDateShort, lighten,
  type StandingsResponse, type CalendarResponse, type DriverStanding,
  type ConstructorStanding, type RaceEntry,
} from '../lib/f1';
import { DriverAvatar } from '../components/media/DriverAvatar';
import { CircuitImage } from '../components/media/CircuitImage';

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const total = target ? Math.max(0, Math.floor((target.getTime() - now) / 1000)) : 0;
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [sRes, cRes] = await Promise.all([
          fetch(`${API_BASE}/api/season/${SEASON_YEAR}/standings`),
          fetch(`${API_BASE}/api/season/${SEASON_YEAR}/calendar`),
        ]);
        if (!sRes.ok || !cRes.ok) throw new Error(`Failed to load ${SEASON_YEAR} season data`);
        const [sJson, cJson] = await Promise.all([sRes.json(), cRes.json()]);
        if (!cancelled) { setStandings(sJson); setCalendar(cJson); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to reach GridLock backend');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const races = useMemo(() => calendar?.races ?? [], [calendar]);
  const nextRace = useMemo(() => races.find(r => r.status === 'upcoming') ?? null, [races]);
  const liveRace = useMemo(() => races.find(r => r.status === 'ongoing') ?? null, [races]);
  const recentRaces = useMemo(() => races.filter(r => r.status === 'completed').slice(-4).reverse(), [races]);
  const upcoming = useMemo(() => races.filter(r => r.status === 'upcoming').slice(0, 4), [races]);

  const target = nextRace ? new Date(`${nextRace.date}T13:00:00Z`) : null;
  const { d, h, m, s } = useCountdown(target);

  const drivers = useMemo(() => standings?.drivers ?? [], [standings]);
  const constructors = useMemo(() => standings?.constructors ?? [], [standings]);
  const [p1, p2] = drivers;
  const top2Total = (p1?.points ?? 0) + (p2?.points ?? 0);
  const p1Share = p1 && top2Total ? Math.round((p1.points / top2Total) * 100) : 50;
  const rounds = standings?.meta.rounds_counted ?? 1;

  if (loading) return <LoadingState />;
  if (error || !standings || !calendar) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-10 pb-20 font-sans selection:bg-[#e10600] selection:text-white">
      <div
        className="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-6 transition-all duration-700 ease-out"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)' }}
      >
        <HeroSection
          nextRace={nextRace} liveRace={liveRace} d={d} h={h} m={m} s={s}
          onOpenSimulator={() => navigate('/simulator-setup')}
          onRaceDetails={() => nextRace && navigate(`/races/${nextRace.race_id}`)}
        />

        {p1 && p2 && (
          <Section delay={100}>
            <ChampionshipBattle p1={p1} p2={p2} p1Share={p1Share} rounds={rounds} />
          </Section>
        )}

        <Section delay={200}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-6">
            <DriversChampionship drivers={drivers} onOpen={() => navigate('/drivers')} />
            <ConstructorsChampionship constructors={constructors} onOpen={() => navigate('/teams')} />
          </div>
        </Section>

        <Section delay={300}>
          <RecentHighlights races={recentRaces} onOpen={(id) => navigate(`/races/${id}`)} onSimulate={() => navigate('/simulator-setup')} />
        </Section>

        <Section delay={400}>
          <UpNext races={upcoming} onViewAll={() => navigate('/events')} onOpen={(id) => navigate(`/races/${id}`)} />
        </Section>
      </div>

      <style>{`
        @keyframes gl-kenburns { from { transform: scale(1.02); } to { transform: scale(1.12); } }
        .gl-kenburns { animation: gl-kenburns 20s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .gl-kenburns, .animate-ping { animation: none !important; } }
      `}</style>
    </div>
  );
}

// ─── Section (staggered entrance) ───────────────────────────────────────────

function Section({ children, delay }: { children: React.ReactNode; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(id);
  }, [delay]);
  return (
    <div className="transition-all duration-700 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)' }}>
      {children}
    </div>
  );
}

function SectionHeader({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">{label}</span>
      {action && (
        <button onClick={onAction} className="text-[10px] font-bold tracking-widest uppercase text-[#e10600] hover:text-[#ff2a1f] transition-colors">
          {action} →
        </button>
      )}
    </div>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────

function HeroSection({
  nextRace, liveRace, d, h, m, s, onOpenSimulator, onRaceDetails,
}: {
  nextRace: RaceEntry | null; liveRace: RaceEntry | null;
  d: number; h: number; m: number; s: number;
  onOpenSimulator: () => void; onRaceDetails: () => void;
}) {
  const featured = nextRace ?? liveRace;
  return (
    <div className="relative w-full min-h-[360px] rounded-2xl overflow-hidden bg-[#111] border border-white/5 shadow-2xl">
      {featured && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <CircuitImage src={featured.image_url} alt={featured.circuit} className="gl-kenburns w-full h-full object-cover" style={{ opacity: 0.92 }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c99] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/40 via-transparent to-transparent" />
        </div>
      )}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 p-8 md:p-12 min-h-[360px]">
        <div className="max-w-xl">
          {liveRace && (
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-[#e10600]/10 border border-[#e10600]/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e10600] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e10600]" />
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#e10600]">Live · {liveRace.name}</span>
            </div>
          )}
          <div className="text-[#e10600] text-xs font-bold tracking-widest uppercase mb-2">Next Race</div>
          {featured ? (
            <>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tight uppercase mb-2 flex items-center gap-3">
                {featured.name} <span className="text-2xl not-italic">{flagFor(featured.country)}</span>
              </h1>
              <p className="text-gray-400 text-sm font-medium mb-8">{featured.circuit} Circuit</p>
              <div className="flex gap-6 md:gap-8 mb-8">
                {[{ v: d, l: 'DAYS' }, { v: h, l: 'HRS' }, { v: m, l: 'MINS' }, { v: s, l: 'SECS' }].map((t, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="font-mono text-3xl font-bold tabular-nums">{pad(t.v)}</span>
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest">{t.l}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button onClick={onRaceDetails} className="bg-[#e10600] hover:bg-[#c90500] text-white px-6 py-2.5 rounded text-sm font-bold transition-all duration-200 hover:shadow-[0_0_20px_rgba(225,6,0,0.4)] active:scale-95">
                  Race Details
                </button>
                <button onClick={onOpenSimulator} className="bg-transparent border border-white/20 hover:bg-white/5 hover:border-white/40 text-white px-6 py-2.5 rounded text-sm font-bold transition-all duration-200 active:scale-95">
                  Open Simulator
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-400 text-lg font-semibold mt-4">Season complete — see you next year.</div>
          )}
        </div>
        {featured && (
          <div className="flex flex-col items-start md:items-end shrink-0">
            <div className="text-xs font-bold tracking-widest text-gray-400">ROUND {featured.round}</div>
            <div className="font-mono text-sm font-bold text-white mb-1 tabular-nums">
              {new Date(`${featured.date}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase()}
            </div>
            <div className="text-xs text-gray-500 text-left md:text-right">{featured.circuit}<br />{featured.country}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Championship Battle (top 2) ────────────────────────────────────────────

function ChampionshipBattle({ p1, p2, p1Share, rounds }: { p1: DriverStanding; p2: DriverStanding; p1Share: number; rounds: number }) {
  const [animatedShare, setAnimatedShare] = useState(50);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedShare(p1Share));
    return () => cancelAnimationFrame(id);
  }, [p1Share]);
  const gap = p1.points - p2.points;
  const sameTeam = p1.team_color === p2.team_color;
  const p1Color = `#${p1.team_color}`;
  const p2Color = sameTeam ? lighten(p2.team_color, 0.45) : `#${p2.team_color}`;
  const leaderColor = gap >= 0 ? p1Color : p2Color;

  return (
    <div className="relative w-full rounded-2xl bg-[#0d0e12] border border-white/5 p-6 md:p-8 overflow-hidden">
      <SectionHeader label={`Championship Battle · ${rounds} Rounds In`} />
      <div className="flex items-center justify-between gap-4 mb-6">
        <DriverBattleCard driver={p1} align="left" color={p1Color} />
        <div className="flex flex-col items-center px-2 shrink-0"><span className="font-mono italic font-black text-lg text-gray-600">VS</span></div>
        <DriverBattleCard driver={p2} align="right" color={p2Color} />
      </div>
      <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">
        <span style={{ color: p1Color }}>{animatedShare}%</span>
        <span>Win Probability</span>
        <span style={{ color: p2Color }}>{100 - animatedShare}%</span>
      </div>
      <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-white/5">
        <div className="h-full rounded-l-full transition-all duration-1000 ease-out" style={{ width: `${animatedShare}%`, backgroundColor: p1Color, marginRight: 2 }} />
        <div className="h-full rounded-r-full transition-all duration-1000 ease-out" style={{ width: `${100 - animatedShare}%`, backgroundColor: p2Color }} />
      </div>
      <div className="mt-4 text-center text-[11px] font-mono text-gray-500">
        {gap === 0 ? 'Dead level on points' : (
          <><span className="font-bold" style={{ color: leaderColor }}>{(gap > 0 ? p1 : p2).name}</span> leads by <span className="text-white font-bold">{Math.abs(gap)}</span> pts</>
        )}
      </div>
    </div>
  );
}

function DriverBattleCard({ driver, align, color }: { driver: DriverStanding; align: 'left' | 'right'; color: string }) {
  const isRight = align === 'right';
  return (
    <div className={`flex items-center gap-4 flex-1 min-w-0 ${isRight ? 'flex-row-reverse text-right' : 'text-left'}`}>
      <DriverAvatar src={driver.image_url} name={driver.name} teamColor={driver.team_color} size={64} rounded="lg" className="border border-white/10" />
      <div className={`min-w-0 ${isRight ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="w-8 h-1 rounded-full mb-2" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}80` }} />
        <div className="font-bold text-lg md:text-xl tracking-tight truncate max-w-full">{driver.name}</div>
        <div className="text-xs text-gray-500 font-medium truncate">{driver.team}</div>
        <div className="font-mono text-2xl md:text-3xl font-black tabular-nums mt-1">{driver.points}<span className="text-xs text-gray-500 ml-1">PTS</span></div>
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{driver.wins} Wins · {driver.podiums} Podiums</div>
      </div>
    </div>
  );
}

// ─── Drivers' Championship (replaces the 4 tiles) ───────────────────────────

function DriversChampionship({ drivers, onOpen }: { drivers: DriverStanding[]; onOpen: () => void }) {
  const top = drivers.slice(0, 10);
  const leaderPts = top[0]?.points ?? 1;
  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-6">
      <SectionHeader label="Drivers' Championship" action="Full Table" onAction={onOpen} />
      <div className="flex flex-col">
        {top.map((drv, i) => {
          const color = `#${drv.team_color}`;
          const gap = leaderPts - drv.points;
          return (
            <div key={drv.abbreviation} className="group flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
              <div className="w-5 text-center font-mono text-sm font-bold shrink-0" style={{ color: i === 0 ? '#e10600' : 'rgba(255,255,255,0.4)' }}>{drv.position}</div>
              <DriverAvatar src={drv.image_url} name={drv.name} teamColor={drv.team_color} size={38} />
              <div className="w-1 h-8 rounded-full shrink-0" style={{ background: color }} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">{drv.name}</div>
                <div className="text-[11px] text-gray-500 truncate">{drv.team}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-sm font-black tabular-nums text-white">{drv.points}</div>
                <div className="text-[10px] text-gray-600 font-mono">{i === 0 ? 'LEADER' : `-${gap}`}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Constructors' Championship ─────────────────────────────────────────────

function ConstructorsChampionship({ constructors, onOpen }: { constructors: ConstructorStanding[]; onOpen: () => void }) {
  const maxPts = constructors[0]?.points ?? 1;
  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-6">
      <SectionHeader label="Constructors' Championship" action="Full Table" onAction={onOpen} />
      <div className="flex flex-col gap-3">
        {constructors.slice(0, 10).map((team, i) => {
          const color = `#${team.color}`;
          const pct = Math.max(4, Math.round((team.points / maxPts) * 100));
          return (
            <div key={team.name} className="flex items-center gap-3">
              <div className="w-4 text-center font-mono text-xs font-bold shrink-0" style={{ color: i === 0 ? '#e10600' : 'rgba(255,255,255,0.35)' }}>{team.position}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white truncate">{team.name}</span>
                  <span className="font-mono text-xs font-black tabular-nums text-white ml-2">{team.points}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Recent Highlights ──────────────────────────────────────────────────────

function RecentHighlights({ races, onOpen, onSimulate }: { races: RaceEntry[]; onOpen: (id: string) => void; onSimulate: () => void }) {
  if (!races.length) {
    return (
      <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-6 flex items-center justify-center text-gray-500 text-sm font-mono">
        No races completed yet this season
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-6">
      <SectionHeader label="Recent Race Highlights" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {races.map(r => (
          <div key={r.race_id} className="group relative rounded-xl overflow-hidden bg-black/40 border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
            <div className="relative h-36 overflow-hidden">
              <CircuitImage src={r.image_url} alt={r.circuit} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110" style={{ opacity: 0.7 }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="text-base">{flagFor(r.country)}</span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-white/70 bg-black/40 px-1.5 py-0.5 rounded">R{r.round}</span>
              </div>
              <div className="absolute bottom-2.5 left-3 right-3">
                <div className="text-sm font-bold text-white truncate">{shortName(r.name)}</div>
                <div className="text-[10px] text-gray-400 font-mono">{r.circuit} · {fmtDateShort(r.date)}</div>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between gap-2">
              {r.winner ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">🏆</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{r.winner}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide truncate" style={{ color: r.winner_team === 'Ferrari' ? '#e8002d' : 'rgba(255,255,255,0.4)' }}>{r.winner_team}</div>
                  </div>
                </div>
              ) : <span className="text-[11px] text-gray-600 font-mono">—</span>}
              <button
                onClick={() => onOpen(r.race_id)}
                className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#e10600] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                Analyze →
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-center">
        <button onClick={onSimulate} className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
          ⚡ Replay any race in the Simulator →
        </button>
      </div>
    </div>
  );
}

// ─── Up Next (upcoming races WITH dates) ────────────────────────────────────

function UpNext({ races, onViewAll, onOpen }: { races: RaceEntry[]; onViewAll: () => void; onOpen: (id: string) => void }) {
  if (!races.length) return null;
  return (
    <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-6">
      <SectionHeader label="Up Next" action="View Full Calendar" onAction={onViewAll} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {races.map(r => (
          <button
            key={r.race_id}
            onClick={() => onOpen(r.race_id)}
            className="group text-left rounded-xl bg-black/30 border border-white/5 hover:border-white/15 p-4 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg">{flagFor(r.country)}</span>
              <span className="text-[10px] font-mono text-gray-600">R{r.round}</span>
            </div>
            <div className="text-sm font-bold text-white truncate group-hover:text-[#e10600] transition-colors">{shortName(r.name)}</div>
            <div className="text-[11px] text-gray-500 truncate mb-2">{r.circuit}</div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-sky-300/80">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              {new Date(`${r.date}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).toUpperCase()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Loading / Error ────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#050505] pt-10 pb-20">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-6">
        <div className="w-full h-[360px] rounded-2xl bg-[#0d0e12] border border-white/5 animate-pulse" />
        <div className="w-full h-[200px] rounded-2xl bg-[#0d0e12] border border-white/5 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-6">
          <div className="h-[420px] rounded-2xl bg-[#0d0e12] border border-white/5 animate-pulse" />
          <div className="h-[420px] rounded-2xl bg-[#0d0e12] border border-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] gap-3">
      <div className="text-[#e10600] font-mono text-sm">⚠️ Connection Lost</div>
      <div className="text-sm text-gray-500 font-mono">{message ?? 'Ensure the backend is running.'}</div>
    </div>
  );
}
