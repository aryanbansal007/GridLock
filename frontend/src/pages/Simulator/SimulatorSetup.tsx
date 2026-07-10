import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/Toast';
import { SeasonSelector } from '../../components/SeasonSelector';
import { CircuitImage } from '../../components/media/CircuitImage';
import { API_BASE, SEASON_YEAR, flagFor, type CalendarResponse } from '../../lib/f1';

interface CachedRace { year: string; gp: string; session: string }

const SESSION_LABELS: Record<string, string> = { Q: 'Qualifying', SQ: 'Sprint Shootout', S: 'Sprint', R: 'Race' };
const SESSION_ORDER = ['Q', 'SQ', 'S', 'R'];

interface RaceGroup {
  race_id: string;
  round: number;
  name: string;
  circuit: string;
  country: string;
  image_url: string;
  sessions: string[];
}

export default function SimulatorSetup() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [year, setYear] = useState(SEASON_YEAR);
  const [cached, setCached] = useState<CachedRace[]>([]);
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState<string | null>(null); // `${race_id}::${session}`

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [listRes, calRes] = await Promise.all([
          fetch(`${API_BASE}/api/races/list`),
          fetch(`${API_BASE}/api/season/${year}/calendar`),
        ]);
        const listData = listRes.ok ? await listRes.json() : { races: [] };
        const calData: CalendarResponse | null = calRes.ok ? await calRes.json() : null;
        if (!cancelled) { setCached(listData.races ?? []); setCalendar(calData); }
      } catch {
        if (!cancelled) { setCached([]); setCalendar(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [year]);

  // Only ever show race/session combos that are ALREADY generated and pushed to the
  // data repo — this is a deliberate constraint, not a limitation: on-demand generation
  // for an uncached session is unreliable on our hosting, so the picker only ever
  // offers choices that are guaranteed to load instantly.
  const groups = useMemo<RaceGroup[]>(() => {
    if (!calendar) return [];
    const byRaceId = new Map<string, RaceGroup>();
    for (const c of cached) {
      if (c.year !== String(year)) continue;
      const race_id = `${c.year}_${c.gp}`;
      const meta = calendar.races.find(r => r.race_id === race_id);
      if (!meta) continue;
      if (!byRaceId.has(race_id)) {
        byRaceId.set(race_id, {
          race_id, round: meta.round, name: meta.name, circuit: meta.circuit,
          country: meta.country, image_url: meta.image_url, sessions: [],
        });
      }
      byRaceId.get(race_id)!.sessions.push(c.session);
    }
    return Array.from(byRaceId.values())
      .map(g => ({ ...g, sessions: g.sessions.sort((a, b) => SESSION_ORDER.indexOf(a) - SESSION_ORDER.indexOf(b)) }))
      .sort((a, b) => a.round - b.round);
  }, [cached, calendar, year]);

  const launch = async (raceId: string, gpSlug: string, session: string) => {
    const key = `${raceId}::${session}`;
    setLaunching(key);
    try {
      const res = await fetch(`${API_BASE}/api/races/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: String(year), gp: gpSlug, session }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.notAvailable) { showToast("This session hasn't been analyzed yet — check back soon.", 'info'); return; }
        throw new Error(data.error || 'Failed to load telemetry');
      }
      navigate(`/simulator/${data.raceId}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load telemetry');
    } finally {
      setLaunching(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-10 pb-20 font-sans">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 mb-2">Live Race Simulator</p>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tight uppercase">Pick A Session To Replay</h1>
            <p className="text-sm text-gray-500 mt-2 max-w-lg">
              Every session below is already analyzed and ready to load instantly — lap-by-lap
              telemetry, live positions, and track conditions on the real circuit layout.
            </p>
          </div>
          <SeasonSelector currentYear={year} onChange={setYear} />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[240px] rounded-2xl bg-[#0d0e12] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-10 flex flex-col items-center justify-center text-center gap-3">
            <div className="text-sm text-gray-400">No simulator-ready sessions cached for {year} yet.</div>
            <button
              onClick={() => navigate('/events')}
              className="text-[11px] font-bold uppercase tracking-widest text-[#e10600] hover:text-[#ff2a1f] transition-colors cursor-pointer"
            >
              Browse Race Calendar →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {groups.map(g => (
              <div key={g.race_id} className="group relative rounded-2xl overflow-hidden bg-[#0d0e12] border border-white/5 hover:border-white/15 transition-all duration-300">
                <div className="relative h-[120px] overflow-hidden">
                  <CircuitImage src={g.image_url} alt={g.circuit} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ opacity: 0.75 }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/30 to-transparent" />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm border border-white/10 text-[10px] font-bold tracking-widest text-white uppercase">
                    Round {g.round}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg leading-none">{flagFor(g.country)}</span>
                      <h3 className="text-base font-bold tracking-tight truncate">{g.name}</h3>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium truncate pl-7">{g.circuit}</p>
                  </div>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {g.sessions.map(s => {
                    const key = `${g.race_id}::${s}`;
                    const isLaunching = launching === key;
                    return (
                      <button
                        key={s}
                        onClick={() => launch(g.race_id, g.race_id.slice(g.race_id.indexOf('_') + 1), s)}
                        disabled={launching !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-[#e10600]/50 hover:bg-[#e10600]/10 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-gray-200 hover:text-white transition-colors cursor-pointer"
                      >
                        {isLaunching && (
                          <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                        )}
                        {SESSION_LABELS[s] ?? s}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
