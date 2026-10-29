import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { documentsUrl, raceControlLogUrl } from '../lib/telemetry';
import { findRaceById, flagFor, fmtDateFull, seasonUrl, type CalendarResponse, type RaceEntry } from '../lib/f1';
import { Kicker } from '../components/standings/parts';

interface LogMessage {
  time: string;
  lap: number | null;
  category: string | null;
  flag: string | null;
  sector: number | null;
  driver: string | null;
  message: string;
}
interface FiaDocument {
  doc: number | null;
  title: string;
  kind: 'decision' | 'infringement' | 'summons' | 'hearing' | 'results' | 'notice';
  cars: number[];
  published: string | null;
  session?: string;
  url: string;
}
interface DocumentsResponse { event: string; source: string; documents: FiaDocument[] }

type LogFilter = 'important' | 'flags' | 'all';

const FLAG_COLOR: Record<string, string> = {
  RED: '#ef4444', YELLOW: '#facc15', 'DOUBLE YELLOW': '#f59e0b', GREEN: '#34d399', CLEAR: '#34d399',
  BLUE: '#60a5fa', CHEQUERED: '#e5e7eb', 'BLACK AND WHITE': '#e5e7eb', BLACK: '#e5e7eb',
};

/** One message's category, for the icon colour and the filter. */
function describe(m: LogMessage): { label: string; color: string; important: boolean } {
  const t = m.message.toUpperCase();
  if (m.category === 'SafetyCar') return { label: 'Safety car', color: '#fb923c', important: true };
  if (m.category === 'SessionStatus') return { label: 'Session', color: '#e5e7eb', important: true };
  if (m.category === 'Flag') {
    const f = (m.flag ?? '').toUpperCase();
    return { label: `${m.flag ?? 'Flag'}`, color: FLAG_COLOR[f] ?? '#9ca3af', important: f === 'RED' || f === 'CHEQUERED' || f === 'BLACK AND WHITE' || f === 'BLACK' };
  }
  if (/PENALTY|DISQUALIF|REPRIMAND/.test(t)) return { label: 'Penalty', color: '#ef4444', important: true };
  if (/INVESTIGAT|NO FURTHER|NOTED|REVIEWED/.test(t)) return { label: 'Stewards', color: '#f59e0b', important: true };
  if (/DELETED/.test(t)) return { label: 'Track limits', color: '#60a5fa', important: true };
  return { label: 'Info', color: '#9ca3af', important: false };
}

const KIND_LABEL: Record<FiaDocument['kind'], string> = {
  decision: 'Decision', infringement: 'Infringement', summons: 'Summons', hearing: 'Hearing', results: 'Classification', notice: 'Notice',
};
const KIND_COLOR: Record<FiaDocument['kind'], string> = {
  decision: '#ef4444', infringement: '#f59e0b', summons: '#fbbf24', hearing: '#a78bfa', results: '#34d399', notice: '#9ca3af',
};
const STEWARDS_KINDS = new Set<FiaDocument['kind']>(['decision', 'infringement', 'summons', 'hearing']);

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D24] ${
      active ? 'border-[#E10600]/60 bg-[#E10600]/12 text-white' : 'border-[#24262B] bg-[#0B0D10] text-[#A7ACB6] hover:text-white'
    }`}
  >
    {children}
  </button>
);

const SESSIONS: { code: string; label: string; sprintOnly?: boolean; standardOnly?: boolean }[] = [
  { code: 'FP1', label: 'Practice 1' },
  { code: 'FP2', label: 'Practice 2', standardOnly: true },
  { code: 'FP3', label: 'Practice 3', standardOnly: true },
  { code: 'SQ', label: 'Sprint Quali', sprintOnly: true },
  { code: 'S', label: 'Sprint', sprintOnly: true },
  { code: 'Q', label: 'Qualifying' },
  { code: 'R', label: 'Race' },
];

/** Race control messages and FIA stewards' documents, one session at a time. */
export default function RaceControlPage() {
  const { raceId = '' } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const year = raceId.split('_')[0];

  const [race, setRace] = useState<RaceEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState('R');
  const [driverMeta, setDriverMeta] = useState<{ numbers: Record<number, string>; colors: Record<string, string> }>({ numbers: {}, colors: {} });

  const [log, setLog] = useState<LogMessage[] | null | 'none'>(null);
  const [docs, setDocs] = useState<DocumentsResponse | null | 'none'>(null);
  const [filter, setFilter] = useState<LogFilter>('important');
  const [query, setQuery] = useState('');
  const [docKind, setDocKind] = useState<'stewards' | 'all'>('stewards');

  useEffect(() => {
    let cancelled = false;
    fetch(seasonUrl(year, 'calendar'))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Season calendar unavailable'))))
      .then((cal: CalendarResponse) => {
        if (cancelled) return;
        const found = findRaceById(cal.races, raceId);
        if (!found) { setError('Race not found'); return; }
        setRace(found);
      })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [raceId, year]);

  useEffect(() => {
    let cancelled = false;
    fetch(seasonUrl(year, 'standings'))
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { drivers?: { abbreviation: string; number?: string | number; team_color?: string }[] }) => {
        if (cancelled) return;
        const numbers: Record<number, string> = {};
        const colors: Record<string, string> = {};
        for (const x of d.drivers ?? []) {
          if (x.number != null) numbers[Number(x.number)] = x.abbreviation;
          if (x.team_color) colors[x.abbreviation] = `#${x.team_color}`;
        }
        setDriverMeta({ numbers, colors });
      })
      .catch(() => { /* driver chips fall back to car numbers */ });
    return () => { cancelled = true; };
  }, [year]);

  const resolved = race && race.race_id === raceId ? race : null;
  const gp = resolved?.name ?? '';

  useEffect(() => {
    if (!gp) return;
    let cancelled = false;
    setLog(null);
    fetch(raceControlLogUrl(year, gp, session))
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { messages?: LogMessage[] }) => { if (!cancelled) setLog(d.messages ?? 'none'); })
      .catch(() => { if (!cancelled) setLog('none'); });
    return () => { cancelled = true; };
  }, [year, gp, session]);

  useEffect(() => {
    if (!gp) return;
    let cancelled = false;
    fetch(documentsUrl(year, gp))
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: DocumentsResponse) => { if (!cancelled) setDocs(d); })
      .catch(() => { if (!cancelled) setDocs('none'); });
    return () => { cancelled = true; };
  }, [year, gp]);

  const hasSprint = resolved?.has_sprint ?? false;
  const tabs = SESSIONS.filter((s) => (s.sprintOnly ? hasSprint : s.standardOnly ? !hasSprint : true));

  const messages = useMemo(() => (Array.isArray(log) ? log : []), [log]);
  // OpenF1 numbers everything before the start as lap 1; call those "Pre" instead.
  const startTime = useMemo(() => messages.find((m) => m.category === 'SessionStatus' && /STARTED/i.test(m.message))?.time ?? null, [messages]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((m) => {
      const d = describe(m);
      if (filter === 'important' && !d.important) return false;
      if (filter === 'flags' && m.category !== 'Flag' && m.category !== 'SafetyCar') return false;
      return !q || m.message.toLowerCase().includes(q) || (m.driver ?? '').toLowerCase().includes(q);
    });
  }, [messages, filter, query]);

  const allDocs = docs && docs !== 'none' ? docs.documents : [];
  const sessionDocs = allDocs.filter((d) => d.session === session);
  const visibleDocs = docKind === 'stewards' ? sessionDocs.filter((d) => STEWARDS_KINDS.has(d.kind)) : sessionDocs;
  const countFor = (code: string) => allDocs.filter((d) => d.session === code && STEWARDS_KINDS.has(d.kind)).length;

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#050505]">
        <div className="font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-[#e10600]">{error}</div>
        <button onClick={() => navigate(`/events?year=${year}`)} className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-400 hover:text-white">← Back to calendar</button>
      </div>
    );
  }
  if (!resolved) {
    return <div className="min-h-screen bg-[#050505] px-8 pt-10"><div className="mx-auto h-64 max-w-[1240px] animate-pulse border border-[#1A1C20] bg-[#0B0D10]" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-20 pt-6 font-sans text-[#F5F5F5]">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <button onClick={() => navigate(`/races/${raceId}`)} className="mb-4 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A7ACB6] transition-colors hover:text-[#F5F5F5]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="m15 18-6-6 6-6" /></svg>
          Back to results
        </button>

        <Kicker>{year} season · round {resolved.round} · race control</Kicker>
        <h1 className="mt-2 flex items-center gap-3 text-[clamp(1.6rem,3.6vw,2.6rem)] font-black uppercase leading-[0.95] tracking-[-0.04em]">
          <span className="text-[0.7em]" aria-hidden>{flagFor(resolved.country)}</span>{resolved.name}
        </h1>
        <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[#C5C9D1]">{resolved.circuit} · {fmtDateFull(resolved.date)}</p>

        <div role="tablist" aria-label="Session" className="mt-6 flex max-w-full overflow-x-auto border border-[#24262B] bg-[#0B0D10]">
          {tabs.map((t) => {
            const active = t.code === session;
            const n = countFor(t.code);
            return (
              <button
                key={t.code} role="tab" aria-selected={active} onClick={() => setSession(t.code)}
                className={`relative shrink-0 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#FF2D24] ${active ? 'bg-[#111318] text-[#F5F5F5]' : 'text-[#A7ACB6] hover:text-[#C9CCD1]'}`}
              >
                {t.label}{n > 0 && <span className="ml-1.5 text-[#6B7079]">{n}</span>}
                {active && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#E10600]" aria-hidden />}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Race control messages */}
          <section className="border border-[#24262B] bg-[#0B0D10] lg:col-span-7" aria-label="Race control messages">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24262B] px-4 py-3">
              <h2 className="flex items-center gap-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C5C9D1]">
                <span className="h-1.5 w-1.5 bg-[#E10600]" aria-hidden />Race control{Array.isArray(log) ? ` · ${shown.length}` : ''}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Chip active={filter === 'important'} onClick={() => setFilter('important')}>Key events</Chip>
                <Chip active={filter === 'flags'} onClick={() => setFilter('flags')}>Flags</Chip>
                <Chip active={filter === 'all'} onClick={() => setFilter('all')}>Everything</Chip>
              </div>
            </div>
            <div className="border-b border-[#1A1C20] px-4 py-2">
              <input
                value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a driver or text"
                aria-label="Search race control messages"
                className="w-full border border-[#24262B] bg-[#050505] px-3 py-1.5 font-mono text-[11px] text-white placeholder:text-[#6B7079] focus:border-[#E10600]/60 focus:outline-none"
              />
            </div>
            <div className="max-h-[640px] overflow-y-auto">
              {log === null && <div className="h-40 animate-pulse bg-white/[0.02]" />}
              {log === 'none' && <Empty text="No race control messages for this session." />}
              {Array.isArray(log) && shown.length === 0 && <Empty text="Nothing matches this filter." />}
              <ol>
                {shown.map((m, i) => {
                  const d = describe(m);
                  return (
                    <li key={i} className="grid grid-cols-[2.6rem_5.2rem_1fr] items-start gap-3 border-b border-[#1A1C20] px-4 py-2.5 last:border-0">
                      <span className="font-mono text-[11px] font-bold tabular-nums text-[#C5C9D1]">
                        {startTime && m.time < startTime ? 'Pre' : m.lap != null ? `L${m.lap}` : '—'}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: d.color }}>
                        <span className="h-2 w-2 shrink-0" style={{ background: d.color }} aria-hidden />{d.label}
                      </span>
                      <span className="text-[13px] leading-snug text-[#E6E8EC]">
                        {m.message}
                        <span className="ml-2 font-mono text-[10px] text-[#6B7079]">{m.time} UTC</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          {/* FIA documents */}
          <section className="border border-[#24262B] bg-[#0B0D10] lg:col-span-5" aria-label="FIA documents">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24262B] px-4 py-3">
              <h2 className="flex items-center gap-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C5C9D1]">
                <span className="h-1.5 w-1.5 bg-[#E10600]" aria-hidden />FIA documents{docs && docs !== 'none' ? ` · ${visibleDocs.length}` : ''}
              </h2>
              <div className="flex gap-2">
                <Chip active={docKind === 'stewards'} onClick={() => setDocKind('stewards')}>Decisions</Chip>
                <Chip active={docKind === 'all'} onClick={() => setDocKind('all')}>All</Chip>
              </div>
            </div>
            <div className="max-h-[640px] overflow-y-auto">
              {docs === null && <div className="h-40 animate-pulse bg-white/[0.02]" />}
              {docs === 'none' && <Empty text="No FIA documents indexed for this race yet." />}
              {docs && docs !== 'none' && (
                <>
                  <p className="border-b border-[#1A1C20] px-4 py-2.5 font-mono text-[10px] leading-relaxed text-[#A7ACB6]">
                    Published by the FIA, grouped by when they were issued. Each link opens the PDF on fia.com.{' '}
                    <a href={docs.source} target="_blank" rel="noopener noreferrer" className="text-[#FF2D24] hover:underline">Whole event ↗</a>
                  </p>
                  {visibleDocs.length === 0 && <Empty text={docKind === 'stewards' ? 'No stewards\' decisions for this session.' : 'No documents for this session.'} />}
                  <ul>
                    {visibleDocs.map((d) => (
                      <li key={d.url} className="border-b border-[#1A1C20] last:border-0">
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="group block px-4 py-3 transition-colors hover:bg-white/[0.03]">
                          <div className="flex items-center justify-between gap-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em]">
                            <span style={{ color: KIND_COLOR[d.kind] }}>{KIND_LABEL[d.kind]}{d.doc != null && <span className="ml-2 text-[#6B7079]">#{d.doc}</span>}</span>
                            <span className="text-[#A7ACB6] group-hover:text-white">PDF ↗</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {d.cars.map((n) => {
                              const code = driverMeta.numbers[n];
                              return (
                                <span key={n} className="px-1.5 py-0.5 font-mono text-[10px] font-black text-white" style={{ background: `${(code && driverMeta.colors[code]) || '#555'}cc` }}>
                                  {code ?? `#${n}`}
                                </span>
                              );
                            })}
                            <span className="text-[13px] leading-snug text-[#E6E8EC]">{d.title}</span>
                          </div>
                          {d.published && <div className="mt-1 font-mono text-[10px] text-[#6B7079]">{d.published}</div>}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#A7ACB6]">{text}</div>;
}
