import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { SEASON_YEAR, type StandingsResponse, type DriverStanding, seasonUrl } from '../lib/f1';
import { DriverAvatar } from '../components/media/DriverAvatar';
import { SeasonSelector } from '../components/SeasonSelector';
import { DriverSeasonCard } from '../components/DriverSeasonCard';
import {
  PageHeader, PointsDelta, PointsBar, GapText, Stat, Watermark, DriverPhoto, Skeleton, ErrorState,
} from '../components/standings/parts';
import { MEDAL, rise } from '../components/standings/tokens';

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
};

// Surnames are never split mid-word, so long ones get a smaller size instead
// ("BORTOLETO", "HULKENBERG" must fit the same column as "NORRIS").
const surnameSize = (last: string, lead: boolean) => {
  const n = last.length;
  const [big, mid, small] = lead ? [3.4, 2.7, 2.2] : [2.1, 1.75, 1.45];
  return `${n <= 7 ? big : n <= 10 ? mid : small}rem`;
};

const activate = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
};

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
        const res = await fetch(seasonUrl(currentYear, 'standings'));
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

  const drivers = useMemo(() => data?.drivers ?? [], [data]);
  const leaderPts = drivers[0]?.points ?? 0;
  const [first, second, third] = drivers;
  const rest = drivers.slice(3);

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-10 font-sans text-[#F5F5F5]">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <PageHeader
          kicker={`${currentYear} season${data ? ` · after round ${data.meta.rounds_counted}` : ''}`}
          title="Driver Standings"
          sub={data ? `${drivers.length} drivers · points from race and sprint results` : 'Loading standings…'}
          right={<SeasonSelector currentYear={currentYear} onChange={setCurrentYear} />}
        />

        {loading && <LoadingState />}
        {error && !loading && <ErrorState message={error} />}

        {!loading && !error && data && first && (
          <div>
            {/* Top three */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-6" style={rise(0)}>
                <LeaderCard driver={first} onSelect={() => setSelectedDriver(first)} />
              </div>
              <div className="grid gap-4 lg:col-span-6">
                {[second, third].filter(Boolean).map((d, i) => (
                  <div key={d.abbreviation} style={rise(i + 1)}>
                    <SideCard driver={d} gap={leaderPts - d.points} onSelect={() => setSelectedDriver(d)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Rest of the field */}
            <div className="mt-10 border border-[#24262B] bg-[#0B0D10]">
              <div className="hidden grid-cols-[2.5rem_1fr_repeat(3,3.5rem)_4rem_9rem] items-center gap-4 border-b border-[#24262B] px-4 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A7ACB6] sm:grid">
                <span className="text-center">Pos</span>
                <span>Driver</span>
                <span className="text-right">Wins</span>
                <span className="text-right">Pod.</span>
                <span className="text-right">DNF</span>
                <span className="text-right">Gap</span>
                <span className="text-right">Points</span>
              </div>
              {rest.map((d, i) => (
                <DriverRow key={d.abbreviation} driver={d} gap={leaderPts - d.points} max={leaderPts} mounted={mounted} index={i} onSelect={() => setSelectedDriver(d)} />
              ))}
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

/** Championship leader: the big card. Portrait fades into the content on wide screens. */
function LeaderCard({ driver: d, onSelect }: { driver: DriverStanding; onSelect: () => void }) {
  const color = `#${d.team_color}`;
  const { first, last } = splitName(d.name);
  return (
    <div
      role="button" tabIndex={0} onClick={onSelect} onKeyDown={activate(onSelect)}
      aria-label={`${d.name}, championship leader, ${d.points} points. Open season details`}
      className="group relative isolate flex h-full min-h-[300px] cursor-pointer flex-col overflow-hidden border border-[#24262B] transition-colors hover:border-[#3a3d44] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D24] sm:min-h-[440px] sm:flex-row"
      style={{ background: `radial-gradient(120% 90% at 85% 0%, ${color}40 0%, transparent 60%), linear-gradient(180deg, #0D0F13, #090A0C)` }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: MEDAL[0] }} />
      <Watermark className="-bottom-4 -right-2 text-[10rem] sm:-bottom-10 sm:text-[21rem]">{d.number}</Watermark>

      <div className="relative z-10 flex flex-1 flex-col justify-between p-6 sm:max-w-[58%] sm:p-8">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: MEDAL[0] }}>
            <span aria-hidden>▲</span> Championship leader
          </div>
          <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-[#C5C9D1]">{first}</div>
          <h2 className="mt-0.5 font-black uppercase leading-[0.92] tracking-[-0.04em]" style={{ fontSize: surnameSize(last, true) }}>{last}</h2>
          <div className="mt-3 flex items-center gap-2.5 text-[13px] text-[#C9CCD1]">
            <span className="h-3 w-[3px]" style={{ background: color }} aria-hidden />
            {d.team}
            <span className="font-mono text-[11px] text-[#A7ACB6]">#{d.number}</span>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[clamp(3rem,6vw,4.5rem)] font-black leading-none tracking-[-0.04em] tabular-nums">{d.points}</span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#C5C9D1]">pts</span>
            <PointsDelta value={d.points_last_race} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
            <Stat label="Wins" value={d.wins} big />
            <Stat label="Podiums" value={d.podiums} big />
            <Stat label="DNF" value={d.dnfs} big />
          </div>
        </div>
      </div>

      <div className="relative order-first h-56 sm:order-none sm:h-auto sm:flex-1">
        <div className="absolute inset-0 sm:[mask-image:linear-gradient(to_right,transparent,black_28%)]">
          <DriverPhoto name={d.name} abbr={d.abbreviation} number={d.number} src={d.image_url} color={color} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#090A0C] to-transparent" />
      </div>
    </div>
  );
}

/** P2 and P3: a compact horizontal card. */
function SideCard({ driver: d, gap, onSelect }: { driver: DriverStanding; gap: number; onSelect: () => void }) {
  const color = `#${d.team_color}`;
  const medal = MEDAL[d.position - 1] ?? '#888';
  const { first, last } = splitName(d.name);
  return (
    <div
      role="button" tabIndex={0} onClick={onSelect} onKeyDown={activate(onSelect)}
      aria-label={`${d.name}, P${d.position}, ${d.points} points. Open season details`}
      className="group relative isolate grid min-h-[212px] cursor-pointer grid-cols-[minmax(7rem,0.8fr)_1.2fr] overflow-hidden border border-[#24262B] transition-colors hover:border-[#3a3d44] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D24]"
      style={{ background: `radial-gradient(110% 120% at 0% 0%, ${color}38 0%, transparent 60%), linear-gradient(180deg, #0D0F13, #090A0C)` }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: medal }} />
      <Watermark className="-bottom-5 right-1 text-[11rem]">{d.number}</Watermark>

      <div className="relative">
        <div className="absolute inset-0 [mask-image:linear-gradient(to_left,transparent,black_30%)]">
          <DriverPhoto name={d.name} abbr={d.abbreviation} number={d.number} src={d.image_url} color={color} />
        </div>
        <span className="absolute left-3 top-4 font-mono text-[26px] font-black leading-none" style={{ color: medal }}>P{d.position}</span>
      </div>

      <div className="relative z-10 flex flex-col justify-between p-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#C5C9D1]">{first}</div>
          <h3 className="font-black uppercase leading-[0.95] tracking-[-0.03em]" style={{ fontSize: surnameSize(last, false) }}>{last}</h3>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-[#C9CCD1]">
            <span className="h-2.5 w-[3px]" style={{ background: color }} aria-hidden />
            <span className="truncate">{d.team}</span>
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-4xl font-black leading-none tracking-[-0.03em] tabular-nums">{d.points}</span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#C5C9D1]">pts</span>
            <PointsDelta value={d.points_last_race} />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 border-t border-white/10 pt-3">
            <Stat label="Wins" value={d.wins} />
            <Stat label="Pod." value={d.podiums} />
            <Stat label="DNF" value={d.dnfs} />
            <Stat label="Gap" value={<GapText gap={gap} />} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DriverRow({ driver: d, gap, max, mounted, index, onSelect }: {
  driver: DriverStanding; gap: number; max: number; mounted: boolean; index: number; onSelect: () => void;
}) {
  const color = `#${d.team_color}`;
  const { first, last } = splitName(d.name);
  return (
    <div
      role="button" tabIndex={0} onClick={onSelect} onKeyDown={activate(onSelect)}
      aria-label={`${d.name}, P${d.position}, ${d.points} points. Open season details`}
      className="group relative grid cursor-pointer grid-cols-[1.75rem_1fr_auto] items-center gap-3 border-b border-[#14161A] px-3 py-2.5 transition-colors sm:px-4 sm:gap-4 last:border-b-0 hover:bg-[#111318] focus-visible:bg-[#111318] focus-visible:outline-none sm:grid-cols-[2.5rem_1fr_repeat(3,3.5rem)_4rem_9rem]"
      style={rise(index + 3)}
    >
      <span className="absolute inset-y-0 left-0 w-[3px] opacity-70 transition-opacity group-hover:opacity-100" style={{ background: color }} aria-hidden />
      <span className="text-center font-mono text-[15px] font-black tabular-nums text-[#A7ACB6] transition-colors group-hover:text-[#F5F5F5]">{d.position}</span>

      <div className="flex min-w-0 items-center gap-3.5">
        <DriverAvatar src={d.image_url} name={d.name} abbr={d.abbreviation} number={d.number} teamColor={d.team_color} size={40} rounded="lg" />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[#A7ACB6] sm:inline">{first}</span>
            <span className="truncate text-[15px] font-black uppercase tracking-[-0.01em]">{last}</span>
            <span className="font-mono text-[10px] text-[#A7ACB6]">#{d.number}</span>
          </div>
          <div className="mt-0.5 truncate text-[12px] text-[#C5C9D1]">{d.team}</div>
        </div>
      </div>

      <span className="hidden text-right font-mono text-[14px] tabular-nums text-[#C9CCD1] sm:block">{d.wins}</span>
      <span className="hidden text-right font-mono text-[14px] tabular-nums text-[#C9CCD1] sm:block">{d.podiums}</span>
      <span className="hidden text-right font-mono text-[14px] tabular-nums text-[#C9CCD1] sm:block">{d.dnfs}</span>
      <span className="hidden text-right sm:block"><GapText gap={gap} /></span>

      <div className="flex min-w-[4.5rem] flex-col items-end gap-1.5 sm:min-w-0">
        <div className="flex items-baseline gap-1.5">
          <PointsDelta value={d.points_last_race} />
          <span className="font-mono text-[22px] font-black leading-none tabular-nums transition-colors group-hover:text-[#FF2D24]">{d.points}</span>
        </div>
        <PointsBar value={d.points} max={max} color={color} mounted={mounted} delay={index * 35} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Skeleton className="h-[440px] lg:col-span-6" />
        <div className="grid gap-4 lg:col-span-6">
          <Skeleton className="h-[212px]" />
          <Skeleton className="h-[212px]" />
        </div>
      </div>
      <div className="mt-10 space-y-px">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[62px]" />)}
      </div>
    </div>
  );
}
