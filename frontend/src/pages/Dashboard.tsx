import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SEASON_YEAR, flagFor, pad, shortName, fmtDateShort, logoFor, type StandingsResponse, type CalendarResponse, type DriverStanding, type ConstructorStanding, type RaceEntry, seasonUrl,
} from '../lib/f1';
import { DriverAvatar } from '../components/media/DriverAvatar';
import { TeamLogo } from '../components/media/TeamLogo';
import { CircuitImage } from '../components/media/CircuitImage';
import { PointsBar, GapText, PointsDelta } from '../components/standings/parts';
import { rise } from '../components/standings/tokens';

const FAV_TEAM_KEY = 'gridlock_favorite_team';
const FAV_DRIVER_KEY = 'gridlock_favorite_driver';

// Most points one driver can still add: 25 for a Grand Prix win plus 8 for a sprint win
// on sprint weekends. Used for the "still in contention" count — a driver is mathematically
// alive while their gap to the leader is no bigger than this.
const RACE_WIN_PTS = 25;
const SPRINT_WIN_PTS = 8;

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
          fetch(seasonUrl(SEASON_YEAR, 'standings')),
          fetch(seasonUrl(SEASON_YEAR, 'calendar')),
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

  // Cancelled rounds (2026 lists a cancelled Bahrain and Saudi Arabia) never count.
  const races = useMemo(() => (calendar?.races ?? []).filter(r => r.status !== 'cancelled'), [calendar]);
  const nextRace = useMemo(() => races.find(r => r.status === 'upcoming') ?? null, [races]);
  const liveRace = useMemo(() => races.find(r => r.status === 'ongoing') ?? null, [races]);
  const recentRaces = useMemo(() => races.filter(r => r.status === 'completed').slice(-4).reverse(), [races]);
  const upcoming = useMemo(() => races.filter(r => r.status === 'upcoming').slice(0, 3), [races]);

  // Count down to the race's actual start (race_time is a full UTC timestamp from
  // FastF1); fall back to 13:00 UTC on the date only when it's missing (e.g. a
  // manually-added cancelled round that never got a real session time).
  const target = nextRace ? new Date(nextRace.race_time ?? `${nextRace.date}T13:00:00Z`) : null;
  const { d, h, m, s } = useCountdown(target);

  const drivers = useMemo(() => standings?.drivers ?? [], [standings]);
  const constructors = useMemo(() => standings?.constructors ?? [], [standings]);

  if (loading) return <LoadingState />;
  if (error || !standings || !calendar) return <ErrorState message={error} />;

  const latestRaceId = recentRaces[0]?.race_id ?? null;

  return (
    <div className="min-h-screen bg-[#050505] pb-16 pt-8 font-sans text-[#F5F5F5] selection:bg-[#e10600] selection:text-white">
      <div
        className="mx-auto max-w-[1400px] space-y-4 px-5 transition-all duration-700 ease-out sm:px-6 lg:px-8"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)' }}
      >
        <HeroSection
          nextRace={nextRace} liveRace={liveRace} d={d} h={h} m={m} s={s}
          onOpenSimulator={() => navigate('/simulator-setup')}
          onRaceDetails={() => nextRace && navigate(`/races/${nextRace.race_id}`)}
        />

        <div style={rise(1)}>
          <CommandBar
            onRaceEngineer={() => navigate('/race-engineer')}
            onSimulator={() => navigate('/simulator-setup')}
            onAnalysis={latestRaceId ? () => navigate(`/analysis/${latestRaceId}`) : null}
            latestName={recentRaces[0] ? shortName(recentRaces[0].name) : null}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5" style={rise(2)}>
            <DriversPanel drivers={drivers} mounted={mounted} onOpen={() => navigate('/drivers')} />
          </div>
          <div className="lg:col-span-4" style={rise(3)}>
            <ConstructorsPanel constructors={constructors} mounted={mounted} onOpen={() => navigate('/teams')} />
          </div>
          <div className="lg:col-span-3" style={rise(4)}>
            <SeasonPanel races={races} drivers={drivers} constructors={constructors} onOpenProfile={() => navigate('/profile')} onCalendar={() => navigate('/events')} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8" style={rise(5)}>
            <RecentResults races={recentRaces} onOpen={(id) => navigate(`/races/${id}`)} onAnalyze={(id) => navigate(`/analysis/${id}`)} />
          </div>
          <div className="lg:col-span-4" style={rise(6)}>
            <UpNext races={upcoming} onViewAll={() => navigate('/events')} onOpen={(id) => navigate(`/races/${id}`)} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gl-kenburns { from { transform: scale(1.02); } to { transform: scale(1.12); } }
        .gl-kenburns { animation: gl-kenburns 20s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .gl-kenburns, .animate-ping { animation: none !important; } }
      `}</style>
    </div>
  );
}

// ─── Panel chrome ───────────────────────────────────────────────────────────

function Panel({ title, action, onAction, children, className = '' }: {
  title: string; action?: string; onAction?: () => void; children: ReactNode; className?: string;
}) {
  return (
    <section className={`flex h-full flex-col border border-[#24262B] bg-[#0B0D10] ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-[#24262B] px-4 py-3">
        <h2 className="flex items-center gap-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#969BA5]">
          <span className="h-1.5 w-1.5 bg-[#E10600]" aria-hidden />{title}
        </h2>
        {action && onAction && (
          <button onClick={onAction} className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#969BA5] transition-colors hover:text-[#FF2D24] focus-visible:text-[#FF2D24] focus-visible:outline-none">
            {action} →
          </button>
        )}
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

const lastName = (name: string) => name.trim().split(/\s+/).slice(-1)[0];

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
                {/* Simulator replays a completed session's real telemetry — nothing to
                    replay for a race that hasn't happened yet. */}
                {featured.status !== 'upcoming' && (
                  <button onClick={onOpenSimulator} className="bg-transparent border border-white/20 hover:bg-white/5 hover:border-white/40 text-white px-6 py-2.5 rounded text-sm font-bold transition-all duration-200 active:scale-95">
                    Open Simulator
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-gray-400 text-lg font-semibold mt-4">Season complete — see you next year.</div>
          )}
        </div>
        {featured && (
          <div className="flex flex-col items-start md:items-end shrink-0">
            <div className="text-xs font-bold tracking-widest text-[#FF2D24] [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">ROUND {featured.round}</div>
            <div className="font-mono text-sm font-bold text-white mb-1 tabular-nums [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
              {new Date(`${featured.date}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase()}
            </div>
            <div className="text-xs font-semibold text-gray-100 text-left md:text-right [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">{featured.circuit}<br />{featured.country}</div>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Command bar: one click into the app's deepest tools ────────────────────

function CommandBar({ onRaceEngineer, onSimulator, onAnalysis, latestName }: {
  onRaceEngineer: () => void; onSimulator: () => void; onAnalysis: (() => void) | null; latestName: string | null;
}) {
  const items = [
    { label: 'Race Engineer AI', sub: 'Ask about strategy, rules, history', onClick: onRaceEngineer, icon: <path d="M4 5h16v10H9l-5 4V5Z M8 9h8 M8 12h5" /> },
    { label: 'Race Simulator', sub: 'Replay any race on track', onClick: onSimulator, icon: <path d="M5 4l14 8-14 8V4Z" /> },
    ...(onAnalysis ? [{ label: 'Latest Analysis', sub: latestName ? `${latestName} · telemetry & strategy` : 'Telemetry & strategy', onClick: onAnalysis, icon: <path d="M3 3v18h18 M7 15l4-6 4 3 4-8" /> }] : []),
  ];
  return (
    <div className="grid grid-cols-1 gap-px border border-[#24262B] bg-[#24262B] sm:grid-cols-3">
      {items.map((t) => (
        <button
          key={t.label}
          onClick={t.onClick}
          className="group flex items-center gap-3.5 bg-[#0B0D10] px-4 py-3.5 text-left transition-colors hover:bg-[#111318] focus-visible:bg-[#111318] focus-visible:outline-none"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#24262B] text-[#E10600] transition-colors group-hover:border-[#E10600]/60">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{t.icon}</svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-[#F5F5F5]">{t.label}</span>
            <span className="block truncate text-[11px] text-[#6B7079]">{t.sub}</span>
          </span>
          <span className="text-[#6B7079] transition-transform group-hover:translate-x-0.5 group-hover:text-[#F5F5F5]" aria-hidden>→</span>
        </button>
      ))}
    </div>
  );
}

// ─── Drivers' championship ──────────────────────────────────────────────────

function DriversPanel({ drivers, mounted, onOpen }: { drivers: DriverStanding[]; mounted: boolean; onOpen: () => void }) {
  const top = drivers.slice(0, 6);
  const leader = top[0]?.points ?? 0;
  return (
    <Panel title="Drivers' championship" action="Full table" onAction={onOpen}>
      <ol>
        {top.map((drv, i) => {
          const color = `#${drv.team_color}`;
          return (
            <li key={drv.abbreviation} className="relative grid grid-cols-[1.5rem_auto_1fr_auto] items-center gap-3 border-b border-[#14161A] px-4 py-2.5 last:border-b-0">
              <span className="absolute inset-y-0 left-0 w-[2px]" style={{ background: color }} aria-hidden />
              <span className={`text-center font-mono text-[13px] font-black tabular-nums ${i === 0 ? 'text-[#FFD700]' : 'text-[#6B7079]'}`}>{drv.position}</span>
              <DriverAvatar src={drv.image_url} name={drv.name} abbr={drv.abbreviation} number={drv.number} teamColor={drv.team_color} size={34} rounded="lg" />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-[14px] font-black uppercase tracking-[-0.01em]">{lastName(drv.name)}</span>
                  <span className="hidden truncate text-[11px] text-[#6B7079] sm:inline">{drv.team}</span>
                </div>
                <div className="mt-1.5 pr-2"><PointsBar value={drv.points} max={leader} color={color} mounted={mounted} delay={i * 50} /></div>
              </div>
              <div className="flex flex-col items-end">
                <span className="flex items-baseline gap-1.5">
                  <PointsDelta value={drv.points_last_race} />
                  <span className="font-mono text-[17px] font-black leading-none tabular-nums">{drv.points}</span>
                </span>
                <span className="mt-1"><GapText gap={leader - drv.points} /></span>
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

// ─── Constructors' championship ─────────────────────────────────────────────

function ConstructorsPanel({ constructors, mounted, onOpen }: { constructors: ConstructorStanding[]; mounted: boolean; onOpen: () => void }) {
  const top = constructors.slice(0, 5);
  const leader = top[0]?.points ?? 0;
  return (
    <Panel title="Constructors" action="Full table" onAction={onOpen}>
      <ol>
        {top.map((team, i) => {
          const color = `#${team.color}`;
          return (
            <li key={team.name} className="relative grid grid-cols-[1.5rem_auto_1fr_auto] items-center gap-3 border-b border-[#14161A] px-4 py-[11px] last:border-b-0">
              <span className="absolute inset-y-0 left-0 w-[2px]" style={{ background: color }} aria-hidden />
              <span className={`text-center font-mono text-[13px] font-black tabular-nums ${i === 0 ? 'text-[#FFD700]' : 'text-[#6B7079]'}`}>{team.position}</span>
              <TeamLogo src={logoFor(team.name)} name={team.name} color={team.color} size={32} />
              <div className="min-w-0">
                <div className="truncate text-[14px] font-black uppercase tracking-[-0.01em]">{team.name}</div>
                <div className="mt-1.5 pr-2"><PointsBar value={team.points} max={leader} color={color} mounted={mounted} delay={i * 50} /></div>
              </div>
              <div className="flex flex-col items-end">
                <span className="flex items-baseline gap-1.5">
                  <PointsDelta value={team.points_last_race} />
                  <span className="font-mono text-[17px] font-black leading-none tabular-nums">{team.points}</span>
                </span>
                <span className="mt-1"><GapText gap={leader - team.points} /></span>
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

// ─── Season: progress, title maths, followed favourites ─────────────────────

function SeasonPanel({ races, drivers, constructors, onOpenProfile, onCalendar }: {
  races: RaceEntry[]; drivers: DriverStanding[]; constructors: ConstructorStanding[]; onOpenProfile: () => void; onCalendar: () => void;
}) {
  const done = races.filter((r) => r.status === 'completed').length;
  const remaining = races.filter((r) => r.status !== 'completed');
  const sprintsLeft = remaining.filter((r) => r.has_sprint).length;
  const maxLeft = remaining.length * RACE_WIN_PTS + sprintsLeft * SPRINT_WIN_PTS;
  const leader = drivers[0];
  const lead = leader && drivers[1] ? leader.points - drivers[1].points : 0;
  const alive = leader ? drivers.filter((d) => leader.points - d.points <= maxLeft).length : 0;

  const [favTeamName] = useState(() => localStorage.getItem(FAV_TEAM_KEY) ?? '');
  const [favDriverAbbr] = useState(() => localStorage.getItem(FAV_DRIVER_KEY) ?? '');
  const favDriver = drivers.find((d) => d.abbreviation === favDriverAbbr);
  const favTeam = constructors.find((t) => t.name === favTeamName);

  return (
    <Panel title="Season" action="Calendar" onAction={onCalendar}>
      <div className="px-4 pt-4">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[28px] font-black leading-none tracking-[-0.03em] tabular-nums">
            {done}<span className="text-[15px] text-[#6B7079]">/{races.length}</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#969BA5]">rounds run</span>
        </div>
        <div className="mt-3 flex gap-[2px]" aria-label={`${done} of ${races.length} rounds completed`} role="img">
          {races.map((r, i) => (
            <span
              key={`${r.race_id}${r.round}`}
              className="h-5 flex-1"
              title={`R${r.round} ${shortName(r.name)}`}
              style={{ background: r.status === 'completed' ? '#E10600' : i === done ? '#F5F5F5' : '#1A1C20' }}
            />
          ))}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-px border-y border-[#24262B] bg-[#24262B]">
        <div className="bg-[#0B0D10] px-4 py-3">
          <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#6B7079]">Leader's margin</dt>
          <dd className="mt-1 font-mono text-[18px] font-black tabular-nums">{lead}<span className="ml-1 text-[10px] text-[#6B7079]">pts</span></dd>
        </div>
        <div className="bg-[#0B0D10] px-4 py-3">
          <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#6B7079]">Max points left</dt>
          <dd className="mt-1 font-mono text-[18px] font-black tabular-nums">{maxLeft}</dd>
        </div>
      </dl>

      <div className="px-4 pt-3 text-[12px] leading-relaxed text-[#969BA5]">
        {leader ? (
          alive <= 1
            ? <><span className="font-bold text-[#F5F5F5]">{leader.name}</span> has the title mathematically secured.</>
            : <><span className="font-bold text-[#F5F5F5]">{alive} drivers</span> can still win the title{sprintsLeft ? ` · ${sprintsLeft} sprint${sprintsLeft > 1 ? 's' : ''} left` : ''}.</>
        ) : 'Standings not available yet.'}
      </div>
      {alive > 1 && (
        <ol className="space-y-1.5 px-4 pb-3 pt-2.5">
          {drivers.slice(0, Math.min(alive, 4)).map((d) => (
            <li key={d.abbreviation} className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
              <span className="h-2.5 w-[2px]" style={{ background: `#${d.team_color}` }} aria-hidden />
              <span className="w-9 font-bold text-[#F5F5F5]">{d.abbreviation}</span>
              <span className="text-[#6B7079]">{d.points} pts</span>
              <span className="ml-auto"><GapText gap={leader.points - d.points} /></span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-auto border-t border-[#24262B] px-4 py-3">
        {favDriver || favTeam ? (
          <div className="space-y-2">
            {favDriver && (
              <div className="flex items-center gap-2.5">
                <DriverAvatar src={favDriver.image_url} name={favDriver.name} abbr={favDriver.abbreviation} number={favDriver.number} teamColor={favDriver.team_color} size={24} />
                <span className="flex-1 truncate text-[12px] font-bold">{lastName(favDriver.name)}</span>
                <span className="font-mono text-[11px] tabular-nums text-[#969BA5]">P{favDriver.position} · {favDriver.points}</span>
              </div>
            )}
            {favTeam && (
              <div className="flex items-center gap-2.5">
                <TeamLogo src={logoFor(favTeam.name)} name={favTeam.name} color={favTeam.color} size={24} />
                <span className="flex-1 truncate text-[12px] font-bold">{favTeam.name}</span>
                <span className="font-mono text-[11px] tabular-nums text-[#969BA5]">P{favTeam.position} · {favTeam.points}</span>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onOpenProfile} className="w-full text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#969BA5] transition-colors hover:text-[#FF2D24]">
            ★ Follow a driver &amp; team →
          </button>
        )}
      </div>
    </Panel>
  );
}

// ─── Recent results ─────────────────────────────────────────────────────────

function RecentResults({ races, onOpen, onAnalyze }: { races: RaceEntry[]; onOpen: (id: string) => void; onAnalyze: (id: string) => void }) {
  return (
    <Panel title="Recent results">
      {!races.length ? (
        <p className="px-4 py-10 text-center font-mono text-[12px] text-[#6B7079]">No races completed yet this season</p>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-[#24262B] xl:grid-cols-4">
          {races.map((r) => (
            <article key={r.race_id} className="group flex flex-col bg-[#0B0D10]">
              <button onClick={() => onOpen(r.race_id)} className="relative h-24 overflow-hidden text-left focus-visible:outline-none" aria-label={`${r.name} race page`}>
                <CircuitImage src={r.image_url} alt="" className="h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/50 to-transparent" />
                <span className="absolute left-3 top-2.5 bg-[#050505]/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#F5F5F5]">R{r.round}</span>
                <span className="absolute bottom-2 left-3 right-3 flex items-center gap-1.5">
                  <span className="text-[13px]" aria-hidden>{flagFor(r.country)}</span>
                  <span className="truncate text-[13px] font-black">{shortName(r.name)}</span>
                </span>
              </button>
              <div className="flex flex-1 flex-col justify-between gap-3 px-3 pb-3 pt-2">
                <div className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[#6B7079]">{r.circuit} · {fmtDateShort(r.date)}</div>
                {r.winner ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#FFD700]">Win</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold">{r.winner}</span>
                      <span className="block truncate text-[10px] uppercase tracking-[0.08em] text-[#6B7079]">{r.winner_team}</span>
                    </span>
                  </div>
                ) : <span className="text-[11px] text-[#6B7079]">—</span>}
                <button onClick={() => onAnalyze(r.race_id)} className="self-start font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#969BA5] transition-colors hover:text-[#FF2D24] focus-visible:text-[#FF2D24] focus-visible:outline-none">
                  Analyze →
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

// ─── Up next ────────────────────────────────────────────────────────────────

function UpNext({ races, onViewAll, onOpen }: { races: RaceEntry[]; onViewAll: () => void; onOpen: (id: string) => void }) {
  // Read once on mount; day granularity doesn't need a ticking clock.
  const [now] = useState(() => Date.now());
  const daysTo = (r: RaceEntry) => {
    const t = new Date(r.race_time ?? `${r.date}T13:00:00Z`).getTime();
    return Math.max(0, Math.ceil((t - now) / 86400000));
  };
  return (
    <Panel title="Up next" action="Calendar" onAction={onViewAll}>
      {!races.length ? (
        <p className="px-4 py-10 text-center font-mono text-[12px] text-[#6B7079]">Season complete — see you next year.</p>
      ) : (
        <ol>
          {races.map((r, i) => (
            <li key={r.race_id}>
              <button
                onClick={() => onOpen(r.race_id)}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[#14161A] px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[#111318] focus-visible:bg-[#111318] focus-visible:outline-none"
              >
                <span className="flex w-10 flex-col items-center border border-[#24262B] py-1">
                  <span className="font-mono text-[15px] font-black leading-none tabular-nums">{new Date(`${r.date}T00:00:00Z`).getUTCDate()}</span>
                  <span className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#6B7079]">
                    {new Date(`${r.date}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[13px]" aria-hidden>{flagFor(r.country)}</span>
                    <span className="truncate text-[13px] font-bold transition-colors group-hover:text-[#FF2D24]">{shortName(r.name)}</span>
                    {r.has_sprint && <span className="border border-[#E10600]/50 px-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-[#FF2D24]">Sprint</span>}
                  </span>
                  <span className="block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B7079]">R{r.round} · {r.circuit}</span>
                </span>
                <span className="text-right font-mono text-[11px] tabular-nums text-[#969BA5]">
                  {i === 0 ? <span className="text-[#F5F5F5]">Next</span> : `${daysTo(r)}d`}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

// ─── Loading / Error ────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#050505] pb-16 pt-8">
      <div className="mx-auto max-w-[1400px] space-y-4 px-5 sm:px-6 lg:px-8">
        <div className="h-[360px] w-full animate-pulse rounded-2xl border border-white/5 bg-[#0d0e12]" />
        <div className="h-[66px] w-full animate-pulse border border-[#1A1C20] bg-[#0B0D10]" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="h-[380px] animate-pulse border border-[#1A1C20] bg-[#0B0D10] lg:col-span-5" />
          <div className="h-[380px] animate-pulse border border-[#1A1C20] bg-[#0B0D10] lg:col-span-4" />
          <div className="h-[380px] animate-pulse border border-[#1A1C20] bg-[#0B0D10] lg:col-span-3" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string | null }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#050505]">
      <div className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-[#e10600]">Connection lost</div>
      <div className="font-mono text-sm text-gray-500">{message ?? 'Ensure the backend is running.'}</div>
    </div>
  );
}
