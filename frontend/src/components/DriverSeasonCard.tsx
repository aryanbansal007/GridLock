import { useEffect, useState } from 'react';
import { API_BASE, shortName, type DriverStanding, type CalendarResponse } from '../lib/f1';
import { DriverAvatar } from './media/DriverAvatar';

interface RaceResultRow {
  position: number | null;
  abbreviation: string;
  points?: number;
}
interface SessionResultsResponse {
  results: RaceResultRow[];
}
interface SeasonRow {
  round: number;
  race_name: string;
  position: number | null;
  points: number;
}

type RowsState = SeasonRow[] | 'loading' | 'error';

// Blurred popup card — click a driver on the Driver Standings page to see their season so
// far (one row per GP with finishing position + points), without leaving the page. The
// bio header needs no fetch at all (the `driver` prop already carries this season's
// position/points/wins/podiums/dnfs, straight from the standings row that was clicked);
// only the per-GP breakdown below it is fetched, by fanning out across every completed
// round of the season (same per-round endpoint RaceDetail.tsx already calls one at a time).
export function DriverSeasonCard({ driver, year, onClose }: { driver: DriverStanding; year: number; onClose: () => void }) {
  const [rows, setRows] = useState<RowsState>('loading');

  useEffect(() => {
    let cancelled = false;
    setRows('loading');
    (async () => {
      try {
        const calRes = await fetch(`${API_BASE}/api/season/${year}/calendar`);
        if (!calRes.ok) throw new Error('calendar unavailable');
        const cal: CalendarResponse = await calRes.json();
        const rounds = cal.races.filter(r => r.status !== 'upcoming');

        const settled = await Promise.all(
          rounds.map(r =>
            fetch(`${API_BASE}/api/session-results/${year}/${r.round}/R`)
              .then(res => (res.ok ? res.json() : null))
              .then((data: SessionResultsResponse | null) => ({ race: r, data }))
              .catch(() => ({ race: r, data: null })),
          ),
        );
        if (cancelled) return;

        const out: SeasonRow[] = [];
        for (const { race, data } of settled) {
          const row = data?.results?.find(x => x.abbreviation === driver.abbreviation);
          if (!row) continue;
          out.push({ round: race.round, race_name: race.name, position: row.position, points: row.points ?? 0 });
        }
        out.sort((a, b) => a.round - b.round);
        setRows(out);
      } catch {
        if (!cancelled) setRows('error');
      }
    })();
    return () => { cancelled = true; };
  }, [driver.abbreviation, year]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const color = `#${driver.team_color}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-2xl bg-[#0d0e12] border border-white/10 overflow-hidden"
        style={{ boxShadow: '0 24px 56px rgba(0,0,0,0.65)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* bio header — fully known already, no fetch */}
        <div className="relative p-5" style={{ background: `linear-gradient(180deg, ${color}22 0%, #0d0e12 70%)` }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 6-12 12M6 6l12 12" /></svg>
          </button>
          <div className="flex items-center gap-4">
            <DriverAvatar src={driver.image_url} name={driver.name} teamColor={driver.team_color} size={72} rounded="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight truncate">{driver.name}</h2>
                <span className="text-xs font-mono text-gray-500 shrink-0">#{driver.number}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-xs text-gray-400 truncate">{driver.team}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            <Stat label="Pos" value={`P${driver.position}`} />
            <Stat label="Points" value={driver.points} />
            <Stat label="Wins" value={driver.wins} />
            <Stat label="Podiums" value={driver.podiums} />
          </div>
        </div>

        {/* season-so-far table — the actual fetch */}
        <div className="border-t border-white/5">
          <div className="grid gap-3 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-500" style={{ gridTemplateColumns: '1fr 70px 70px' }}>
            <span>Grand Prix</span><span className="text-right">Pos</span><span className="text-right">Points</span>
          </div>
          <div className="max-h-[46vh] overflow-y-auto divide-y divide-white/[0.04]">
            {rows === 'loading' && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-3"><div className="h-4 rounded bg-white/[0.04] animate-pulse" /></div>
            ))}
            {rows === 'error' && (
              <div className="py-10 text-center text-gray-500 text-xs font-mono">Couldn't load season results.</div>
            )}
            {Array.isArray(rows) && rows.length === 0 && (
              <div className="py-10 text-center text-gray-500 text-xs font-mono">No results yet for {year}.</div>
            )}
            {Array.isArray(rows) && rows.map(r => (
              <div key={r.round} className="grid gap-3 px-5 py-3 items-center text-sm" style={{ gridTemplateColumns: '1fr 70px 70px' }}>
                <span className="truncate font-medium">{shortName(r.race_name)}</span>
                <span className="text-right font-mono font-bold text-gray-300">{r.position != null ? `P${r.position}` : '—'}</span>
                <span className="text-right font-mono font-bold">{r.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-2 py-1.5 text-center">
      <div className="text-sm font-mono font-black tabular-nums">{value}</div>
      <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{label}</div>
    </div>
  );
}
