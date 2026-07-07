import { useEffect, useMemo, useState } from 'react';
import {
  API_BASE, SEASON_YEAR, logoFor,
  type StandingsResponse, type ConstructorStanding, type DriverStanding,
} from '../lib/f1';
import { TeamLogo } from '../components/media/TeamLogo';
import { SeasonSelector } from '../components/SeasonSelector';

const MEDAL = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function Teams() {
  const [currentYear, setCurrentYear] = useState<number>(SEASON_YEAR);
  const [data, setData] = useState<StandingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/season/${currentYear}/standings`);
        if (!res.ok) throw new Error(`No data for the ${currentYear} season yet`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentYear]);

  useEffect(() => { const id = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(id); }, []);

  // group drivers by team (sorted by points) so each team card can show its line-up
  const driversByTeam = useMemo(() => {
    const map: Record<string, DriverStanding[]> = {};
    for (const d of data?.drivers ?? []) (map[d.team] ??= []).push(d);
    for (const k in map) map[k].sort((a, b) => b.points - a.points);
    return map;
  }, [data]);

  const constructors = data?.constructors ?? [];
  const podium = constructors.slice(0, 3);
  const rest = constructors.slice(3);
  const podiumDisplay = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-10 pb-20 font-sans">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">{currentYear} Season</p>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tight uppercase">Constructor Standings</h1>
            <p className="text-sm text-gray-500 mt-1">{data ? `${data.meta.rounds_counted} rounds completed · team championship` : 'Loading telemetry…'}</p>
          </div>
          <SeasonSelector currentYear={currentYear} onChange={setCurrentYear} />
        </div>

        {loading && <SkeletonTeams />}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <div className="text-[#e10600] font-mono text-sm">Connection Lost</div>
            <div className="text-xs text-gray-500 font-mono">{error}</div>
          </div>
        )}

        {!loading && !error && data && (
          <div className="transition-all duration-700 ease-out" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(14px)' }}>
            <div className="grid grid-cols-3 gap-3 md:gap-5 items-end mb-10">
              {podiumDisplay.map(t => <TeamPodiumCard key={t.name} team={t} drivers={driversByTeam[t.name] ?? []} />)}
            </div>
            <div className="flex flex-col gap-2">
              {rest.map(t => <TeamRow key={t.name} team={t} drivers={driversByTeam[t.name] ?? []} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamPodiumCard({ team, drivers }: { team: ConstructorStanding; drivers: DriverStanding[] }) {
  const rank = team.position;
  const medal = MEDAL[rank - 1] ?? '#888';
  const color = `#${team.color}`;
  const isFirst = rank === 1;
  return (
    <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 ${isFirst ? 'border-white/15' : 'border-white/5'}`}
      style={{ background: `linear-gradient(180deg, ${color}26 0%, #0d0e12 55%)`, marginTop: isFirst ? 0 : 24 }}>
      <div className="h-1" style={{ background: color }} />
      <div className="p-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-2xl font-black" style={{ color: medal }}>P{rank}</span>
        </div>
        <TeamLogo src={logoFor(team.name)} name={team.name} color={team.color} size={isFirst ? 68 : 54} className="mb-3" />
        <div className="text-sm md:text-base font-bold tracking-tight truncate max-w-full">{team.name}</div>
        <div className="text-[10px] text-gray-500 truncate max-w-full mb-2">{drivers.slice(0, 2).map(d => d.abbreviation).join(' · ')}</div>
        <div className="font-mono text-2xl md:text-3xl font-black tabular-nums">{team.points}<span className="text-[10px] text-gray-500 ml-1">PTS</span><PointsDelta value={team.points_last_race} /></div>
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{team.wins}W · {team.podiums}P</div>
      </div>
    </div>
  );
}

function TeamRow({ team, drivers }: { team: ConstructorStanding; drivers: DriverStanding[] }) {
  const color = `#${team.color}`;
  return (
    <div className="group flex items-center gap-4 rounded-xl bg-[#0d0e12] border border-white/5 hover:border-white/15 px-4 py-3 transition-all duration-300">
      <div className="w-7 text-center font-mono text-lg font-black text-gray-500 group-hover:text-white transition-colors shrink-0">{team.position}</div>
      <TeamLogo src={logoFor(team.name)} name={team.name} color={team.color} size={40} />
      <div className="w-1 h-10 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}66` }} />
      <div className="min-w-0 flex-1">
        <div className="text-base font-bold tracking-tight truncate">{team.name}</div>
        <div className="text-xs text-gray-500 truncate">{drivers.slice(0, 2).map(d => d.name).join(' · ')}</div>
      </div>
      <div className="hidden sm:flex items-center gap-6 pr-6 border-r border-white/5 text-right">
        <Stat label="Wins" value={team.wins} />
        <Stat label="Podiums" value={team.podiums} />
      </div>
      <div className="flex flex-col items-end min-w-[70px]">
        <div className="flex items-center gap-1">
          <span className="font-mono text-2xl font-black tabular-nums group-hover:text-[#e10600] transition-colors">{team.points}</span>
          <PointsDelta value={team.points_last_race} />
        </div>
        <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest -mt-1">Points</span>
      </div>
    </div>
  );
}

// Points gained in the most recent completed round — nothing rendered if the team didn't
// score (0 or undefined), so it never implies a "just raced" state when they didn't.
function PointsDelta({ value }: { value?: number }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-400">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      {value}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{label}</span>
      <span className="font-mono text-base font-bold text-gray-300">{value}</span>
    </div>
  );
}

function SkeletonTeams() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 md:gap-5 items-end mb-10">
        {[0, 1, 2].map(i => <div key={i} className="rounded-2xl bg-[#0d0e12] border border-white/5 animate-pulse" style={{ height: 210, marginTop: i === 1 ? 0 : 24 }} />)}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-[68px] rounded-xl bg-[#0d0e12] border border-white/5 animate-pulse" />)}
      </div>
    </div>
  );
}
