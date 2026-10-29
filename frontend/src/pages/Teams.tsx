import { useEffect, useMemo, useState } from 'react';
import {
  SEASON_YEAR, logoFor, type StandingsResponse, type ConstructorStanding, type DriverStanding, seasonUrl,
} from '../lib/f1';
import { TeamLogo } from '../components/media/TeamLogo';
import { SeasonSelector } from '../components/SeasonSelector';
import {
  PageHeader, PointsDelta, PointsBar, GapText, Stat, Watermark, Skeleton, ErrorState,
} from '../components/standings/parts';
import { MEDAL, rise } from '../components/standings/tokens';

const lastName = (name: string) => name.trim().split(/\s+/).slice(-1)[0];

// Team names wrap at spaces only, never inside a word, so the size follows the longest
// word ("MERCEDES" fits at full size, "ASTON" / "MARTIN" are short, a long single word shrinks).
const nameSize = (name: string, lead: boolean) => {
  const n = Math.max(...name.split(/\s+/).map((w) => w.length));
  const [big, mid, small] = lead ? [3.3, 2.7, 2.2] : [1.9, 1.6, 1.35];
  return `${n <= 7 ? big : n <= 9 ? mid : small}rem`;
};

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

  // each team's line-up, best scorer first
  const driversByTeam = useMemo(() => {
    const map: Record<string, DriverStanding[]> = {};
    for (const d of data?.drivers ?? []) (map[d.team] ??= []).push(d);
    for (const k in map) map[k].sort((a, b) => b.points - a.points);
    return map;
  }, [data]);

  const constructors = data?.constructors ?? [];
  const leaderPts = constructors[0]?.points ?? 0;
  const [first, second, third] = constructors;
  const rest = constructors.slice(3);

  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-10 font-sans text-[#F5F5F5]">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <PageHeader
          kicker={`${currentYear} season${data ? ` · after round ${data.meta.rounds_counted}` : ''}`}
          title="Constructor Standings"
          sub={data ? `${constructors.length} teams · combined points of both drivers` : 'Loading standings…'}
          right={<SeasonSelector currentYear={currentYear} onChange={setCurrentYear} />}
        />

        {loading && <LoadingState />}
        {error && !loading && <ErrorState message={error} />}

        {!loading && !error && data && first && (
          <div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-6" style={rise(0)}>
                <LeaderCard team={first} drivers={driversByTeam[first.name] ?? []} />
              </div>
              <div className="grid gap-4 lg:col-span-6">
                {[second, third].filter(Boolean).map((t, i) => (
                  <div key={t.name} style={rise(i + 1)}>
                    <SideCard team={t} drivers={driversByTeam[t.name] ?? []} gap={leaderPts - t.points} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 border border-[#24262B] bg-[#0B0D10]">
              <div className="hidden grid-cols-[2.5rem_1fr_repeat(2,3.5rem)_4rem_9rem] items-center gap-4 border-b border-[#24262B] px-4 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A7ACB6] sm:grid">
                <span className="text-center">Pos</span>
                <span>Team</span>
                <span className="text-right">Wins</span>
                <span className="text-right">Pod.</span>
                <span className="text-right">Gap</span>
                <span className="text-right">Points</span>
              </div>
              {rest.map((t, i) => (
                <TeamRow key={t.name} team={t} drivers={driversByTeam[t.name] ?? []} gap={leaderPts - t.points} max={leaderPts} mounted={mounted} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** The team's badge, large, over a team-coloured field with faint concentric rings. */
function LogoPanel({ team, size }: { team: ConstructorStanding; size: number }) {
  const color = `#${team.color}`;
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {[70, 120, 170, 220, 270].map((r) => (
          <circle key={r} cx="200" cy="200" r={r} fill="none" stroke={color} strokeOpacity={0.22 - r / 2400} strokeWidth="1" />
        ))}
      </svg>
      <div className="relative" style={{ filter: `drop-shadow(0 18px 40px ${color}66)` }}>
        <TeamLogo src={logoFor(team.name)} name={team.name} color={team.color} size={size} />
      </div>
    </div>
  );
}

function LeaderCard({ team: t, drivers }: { team: ConstructorStanding; drivers: DriverStanding[] }) {
  const color = `#${t.color}`;
  return (
    <div
      className="relative isolate flex h-full min-h-[300px] flex-col overflow-hidden border border-[#24262B] sm:min-h-[440px] sm:flex-row"
      style={{ background: `radial-gradient(120% 90% at 85% 0%, ${color}40 0%, transparent 60%), linear-gradient(180deg, #0D0F13, #090A0C)` }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: color }} />
      <Watermark className="-bottom-4 -right-2 text-[10rem] sm:-bottom-10 sm:text-[21rem]">1</Watermark>

      <div className="relative z-10 flex flex-1 flex-col justify-between p-6 sm:max-w-[54%] sm:p-8">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: MEDAL[0] }}>
            <span aria-hidden>▲</span> Constructors' leader
          </div>
          <h2 className="mt-8 font-black uppercase leading-[0.92] tracking-[-0.04em]" style={{ fontSize: nameSize(t.name, true) }}>{t.name}</h2>
          <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#C5C9D1]">
            {drivers.slice(0, 2).map((d) => lastName(d.name)).join(' · ')}
          </div>
        </div>
        <div className="mt-8">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[clamp(3rem,6vw,4.5rem)] font-black leading-none tracking-[-0.04em] tabular-nums">{t.points}</span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#C5C9D1]">pts</span>
            <PointsDelta value={t.points_last_race} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
            <Stat label="Wins" value={t.wins} big />
            <Stat label="Podiums" value={t.podiums} big />
          </div>
        </div>
      </div>

      <div className="relative order-first h-56 sm:order-none sm:h-auto sm:flex-1">
        <LogoPanel team={t} size={210} />
      </div>
    </div>
  );
}

function SideCard({ team: t, drivers, gap }: { team: ConstructorStanding; drivers: DriverStanding[]; gap: number }) {
  const color = `#${t.color}`;
  const medal = MEDAL[t.position - 1] ?? '#888';
  return (
    <div
      className="relative isolate grid min-h-[212px] grid-cols-[minmax(7.5rem,0.7fr)_1.3fr] overflow-hidden border border-[#24262B]"
      style={{ background: `radial-gradient(110% 120% at 0% 0%, ${color}38 0%, transparent 60%), linear-gradient(180deg, #0D0F13, #090A0C)` }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: medal }} />
      <Watermark className="-bottom-5 right-1 text-[11rem]">{t.position}</Watermark>

      <div className="relative">
        <LogoPanel team={t} size={92} />
        <span className="absolute left-3 top-4 font-mono text-[26px] font-black leading-none" style={{ color: medal }}>P{t.position}</span>
      </div>

      <div className="relative z-10 flex flex-col justify-between p-5">
        <div>
          <h3 className="font-black uppercase leading-[0.95] tracking-[-0.03em]" style={{ fontSize: nameSize(t.name, false) }}>{t.name}</h3>
          <div className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[#C5C9D1]">{drivers.slice(0, 2).map((d) => lastName(d.name)).join(' · ')}</div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-4xl font-black leading-none tracking-[-0.03em] tabular-nums">{t.points}</span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#C5C9D1]">pts</span>
            <PointsDelta value={t.points_last_race} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
            <Stat label="Wins" value={t.wins} />
            <Stat label="Pod." value={t.podiums} />
            <Stat label="Gap" value={<GapText gap={gap} />} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamRow({ team: t, drivers, gap, max, mounted, index }: {
  team: ConstructorStanding; drivers: DriverStanding[]; gap: number; max: number; mounted: boolean; index: number;
}) {
  const color = `#${t.color}`;
  return (
    <div
      className="group relative grid grid-cols-[1.75rem_1fr_auto] items-center gap-3 border-b border-[#14161A] px-3 py-2.5 transition-colors last:border-b-0 hover:bg-[#111318] sm:grid-cols-[2.5rem_1fr_repeat(2,3.5rem)_4rem_9rem] sm:gap-4 sm:px-4"
      style={rise(index + 3)}
    >
      <span className="absolute inset-y-0 left-0 w-[3px] opacity-70 transition-opacity group-hover:opacity-100" style={{ background: color }} aria-hidden />
      <span className="text-center font-mono text-[15px] font-black tabular-nums text-[#A7ACB6] transition-colors group-hover:text-[#F5F5F5]">{t.position}</span>

      <div className="flex min-w-0 items-center gap-3.5">
        <TeamLogo src={logoFor(t.name)} name={t.name} color={t.color} size={38} />
        <div className="min-w-0">
          <div className="truncate text-[15px] font-black uppercase tracking-[-0.01em]">{t.name}</div>
          <div className="mt-0.5 truncate text-[12px] text-[#C5C9D1]">{drivers.slice(0, 2).map((d) => lastName(d.name)).join(' · ')}</div>
        </div>
      </div>

      <span className="hidden text-right font-mono text-[14px] tabular-nums text-[#C9CCD1] sm:block">{t.wins}</span>
      <span className="hidden text-right font-mono text-[14px] tabular-nums text-[#C9CCD1] sm:block">{t.podiums}</span>
      <span className="hidden text-right sm:block"><GapText gap={gap} /></span>

      <div className="flex min-w-[4.5rem] flex-col items-end gap-1.5 sm:min-w-0">
        <div className="flex items-baseline gap-1.5">
          <PointsDelta value={t.points_last_race} />
          <span className="font-mono text-[22px] font-black leading-none tabular-nums transition-colors group-hover:text-[#FF2D24]">{t.points}</span>
        </div>
        <PointsBar value={t.points} max={max} color={color} mounted={mounted} delay={index * 35} />
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
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-[62px]" />)}
      </div>
    </div>
  );
}
