import { useEffect, useState } from 'react';
import {
  API_BASE, SEASON_YEAR, lighten,
  type StandingsResponse, type DriverStanding,
} from '../lib/f1';
import { DriverAvatar } from '../components/media/DriverAvatar';
import { SeasonSelector } from '../components/SeasonSelector';
import { DriverSeasonCard } from '../components/DriverSeasonCard';

const MEDAL = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze

export default function Drivers() {
  const [currentYear, setCurrentYear] = useState<number>(SEASON_YEAR);
  const [data, setData] = useState<StandingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverStanding | null>(null);

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

  const drivers = data?.drivers ?? [];
  const podium = drivers.slice(0, 3);
  const rest = drivers.slice(3);
  // display order for podium: 2nd, 1st, 3rd (center elevated)
  const podiumDisplay = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-10 pb-20 font-sans">
      <div className="max-w-[1100px] mx-auto px-6">

        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">{currentYear} Season</p>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tight uppercase">Driver Standings</h1>
            <p className="text-sm text-gray-500 mt-1">{data ? `${data.meta.rounds_counted} rounds completed · points from race results` : 'Loading telemetry…'}</p>
          </div>
          <SeasonSelector currentYear={currentYear} onChange={setCurrentYear} />
        </div>

        {loading && <SkeletonStandings />}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <div className="text-[#e10600] font-mono text-sm">Connection Lost</div>
            <div className="text-xs text-gray-500 font-mono">{error}</div>
          </div>
        )}

        {!loading && !error && data && (
          <div className="transition-all duration-700 ease-out" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(14px)' }}>
            {/* Podium */}
            <div className="grid grid-cols-3 gap-3 md:gap-5 items-end mb-10">
              {podiumDisplay.map(d => <PodiumCard key={d.abbreviation} driver={d} onSelect={() => setSelectedDriver(d)} />)}
            </div>

            {/* Rest */}
            <div className="flex flex-col gap-2">
              {rest.map(d => <DriverRow key={d.abbreviation} driver={d} onSelect={() => setSelectedDriver(d)} />)}
            </div>
          </div>
        )}
      </div>

      {selectedDriver && (
        <DriverSeasonCard driver={selectedDriver} year={currentYear} onClose={() => setSelectedDriver(null)} />
      )}
    </div>
  );
}

// Real riser height per rank — the bigger the gap between 1st/2nd/3rd, the more
// it reads as an actual medal-ceremony podium instead of three equal cards.
const RISER_HEIGHT: Record<number, number> = { 1: 116, 2: 80, 3: 56 };

function PodiumCard({ driver: d, onSelect }: { driver: DriverStanding; onSelect: () => void }) {
  const rank = d.position; // 1,2,3
  const medal = MEDAL[rank - 1] ?? '#888';
  const color = `#${d.team_color}`;
  const isFirst = rank === 1;
  const riser = RISER_HEIGHT[rank] ?? 56;
  return (
    <div className="flex flex-col items-center transition-transform duration-300 hover:-translate-y-1 cursor-pointer" onClick={onSelect}>
      {/* driver info card */}
      <div
        className={`relative w-full rounded-2xl overflow-hidden border ${isFirst ? 'border-white/15' : 'border-white/5'}`}
        style={{ background: `linear-gradient(180deg, ${color}22 0%, #0d0e12 55%)` }}
      >
        <div className="h-1" style={{ background: medal }} />
        <div className="p-4 flex flex-col items-center text-center">
          {isFirst && <span className="text-[10px] font-bold tracking-widest uppercase text-[#FFD700] mb-2">Leader</span>}
          <DriverAvatar src={d.image_url} name={d.name} teamColor={d.team_color} size={isFirst ? 92 : 72} rounded="lg" className="mb-3" />
          <div className="flex items-center gap-1.5 max-w-full">
            <span className="text-sm md:text-base font-bold tracking-tight truncate">{d.name}</span>
            <span className="text-[10px] font-mono text-gray-600 shrink-0">#{d.number}</span>
          </div>
          <div className="text-[11px] text-gray-500 font-medium mb-2 truncate max-w-full">{d.team}</div>
          <div className="w-8 h-1 rounded-full mb-2" style={{ background: color, boxShadow: `0 0 10px ${color}80` }} />
          <div className="font-mono text-2xl md:text-3xl font-black tabular-nums">{d.points}<span className="text-[10px] text-gray-500 ml-1">PTS</span><PointsDelta value={d.points_last_race} /></div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{d.wins}W · {d.podiums}P</div>
        </div>
      </div>

      {/* podium riser — the driver visibly "stands" on a block whose height encodes rank */}
      <div
        className="w-full flex items-start justify-center rounded-b-lg relative overflow-hidden"
        style={{
          height: riser,
          marginTop: -1,
          background: `linear-gradient(180deg, ${medal}2e 0%, rgba(255,255,255,0.02) 100%)`,
          borderTop: `2px solid ${medal}`,
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="font-mono font-black leading-none pt-2" style={{ fontSize: riser * 0.44, color: `${medal}` , opacity: 0.9 }}>{rank}</span>
      </div>
    </div>
  );
}

function DriverRow({ driver: d, onSelect }: { driver: DriverStanding; onSelect: () => void }) {
  const color = `#${d.team_color}`;
  const glow = lighten(d.team_color, 0.1);
  return (
    <div
      onClick={onSelect}
      className="group relative flex items-center gap-4 rounded-xl bg-[#0d0e12] border border-white/5 hover:border-white/15 px-4 py-3 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      <div className="absolute inset-y-0 left-0 w-1/3 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
        style={{ background: `linear-gradient(to right, ${glow}, transparent)` }} />
      <div className="relative z-10 w-7 text-center font-mono text-lg font-black text-gray-500 group-hover:text-white transition-colors shrink-0">{d.position}</div>
      <DriverAvatar src={d.image_url} name={d.name} teamColor={d.team_color} size={46} className="relative z-10" />
      <div className="relative z-10 w-1 h-10 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}66` }} />
      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight truncate">{d.name}</span>
          <span className="text-[10px] font-mono text-gray-600 shrink-0">#{d.number}</span>
        </div>
        <div className="text-xs text-gray-500 truncate">{d.team}</div>
      </div>
      <div className="relative z-10 hidden sm:flex items-center gap-6 pr-6 border-r border-white/5 text-right">
        <Stat label="Wins" value={d.wins} />
        <Stat label="Podiums" value={d.podiums} />
        <Stat label="DNF" value={d.dnfs} />
      </div>
      <div className="relative z-10 flex flex-col items-end min-w-[70px]">
        <div className="flex items-center gap-1">
          <span className="font-mono text-2xl font-black tabular-nums group-hover:text-[#e10600] transition-colors">{d.points}</span>
          <PointsDelta value={d.points_last_race} />
        </div>
        <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest -mt-1">Points</span>
      </div>
    </div>
  );
}

// Points gained in the most recent completed round — nothing rendered if the driver/team
// didn't score (0 or undefined), so it never implies a "just raced" state when they didn't.
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

function SkeletonStandings() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 md:gap-5 items-end mb-10">
        {[76, 96, 76].map((h, i) => <div key={i} className="rounded-2xl bg-[#0d0e12] border border-white/5 animate-pulse" style={{ height: h + 140, marginTop: i === 1 ? 0 : 24 }} />)}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[68px] rounded-xl bg-[#0d0e12] border border-white/5 animate-pulse" />)}
      </div>
    </div>
  );
}
