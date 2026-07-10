import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API_BASE } from '../lib/f1';

const SEASON_YEAR = 2026;

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', activeMatch: ['/dashboard'] },
  { path: '/drivers', label: 'Drivers', activeMatch: ['/drivers'] },
  { path: '/teams', label: 'Teams', activeMatch: ['/teams'] },
  { path: '/events', label: 'Races', activeMatch: ['/events', '/races'] },
];

// ─── Types (mirror backend/src/cache/season/<year>/{standings,calendar}.json) ──

interface DriverStanding { name: string; team: string; number: string }
interface ConstructorStanding { name: string }
interface StandingsResponse { drivers: DriverStanding[]; constructors: ConstructorStanding[] }
interface RaceEntry { round: number; name: string; circuit: string; date: string; status: 'completed' | 'ongoing' | 'upcoming'; race_id: string; race_time?: string | null }
interface CalendarResponse { races: RaceEntry[] }

type SearchResult = { kind: 'Driver' | 'Team' | 'Race'; label: string; sub: string; onSelect: () => void };

const pad = (n: number) => String(n).padStart(2, '0');

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

export const TopNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [connected, setConnected] = useState(false);

  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [standings, setStandings] = useState<StandingsResponse | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const username = useMemo(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const decoded = jwtDecode<{ username?: string }>(token);
      return decoded.username ?? null;
    } catch {
      return null;
    }
  }, []);

  // Scroll shadow/blur intensity + hide-past-own-height — the moment you've scrolled
  // down further than the nav's own height (60px), it disappears; scrolling back up
  // above that same threshold brings it back.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      setNavHidden(y > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Backend connection status — a simple periodic health-check poll (same pattern
  // Profile.tsx already uses for its own backend-status indicator) instead of a
  // dedicated Socket.io connection, now that the only real-time feature (Paddock
  // Chat) has been removed.
  useEffect(() => {
    let cancelled = false;
    const checkHealth = () => {
      fetch(`${API_BASE}/health`)
        .then(r => { if (!cancelled) setConnected(r.ok); })
        .catch(() => { if (!cancelled) setConnected(false); });
    };
    checkHealth();
    const id = setInterval(checkHealth, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Real season data — powers the next-race chip and search
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch(`${API_BASE}/api/season/${SEASON_YEAR}/calendar`),
          fetch(`${API_BASE}/api/season/${SEASON_YEAR}/standings`),
        ]);
        if (cancelled) return;
        if (cRes.ok) setCalendar(await cRes.json());
        if (sRes.ok) setStandings(await sRes.json());
      } catch {
        // Nav bar degrades to logo + links if the backend is unreachable
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const races = useMemo(() => calendar?.races ?? [], [calendar]);
  const nextRace = useMemo(() => races.find(r => r.status === 'upcoming') ?? null, [races]);
  const liveRace = useMemo(() => races.find(r => r.status === 'ongoing') ?? null, [races]);
  // Shows for a ~6hr window right after a race is marked completed (itself ~4hrs after
  // the Race session starts, server-side) — long enough to cover FastF1/official-results
  // lag without leaving a stale "results updating" chip up indefinitely.
  const justFinishedRace = useMemo(() => races.find(r => {
    if (r.status !== 'completed' || !r.race_time) return false;
    const hoursSince = (Date.now() - new Date(r.race_time).getTime()) / 3_600_000;
    return hoursSince < 10;
  }) ?? null, [races]);
  // Count down to the race's actual start (race_time is a full UTC timestamp from
  // FastF1); fall back to 13:00 UTC on the date only when it's missing.
  const target = nextRace ? new Date(nextRace.race_time ?? `${nextRace.date}T13:00:00Z`) : null;
  const { d, h, m, s } = useCountdown(target);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: SearchResult[] = [];
    for (const drv of standings?.drivers ?? []) {
      if (drv.name.toLowerCase().includes(q) || drv.team.toLowerCase().includes(q)) {
        out.push({ kind: 'Driver', label: drv.name, sub: drv.team, onSelect: () => navigate('/drivers') });
      }
    }
    for (const team of standings?.constructors ?? []) {
      if (team.name.toLowerCase().includes(q)) {
        out.push({ kind: 'Team', label: team.name, sub: 'Constructor', onSelect: () => navigate('/teams') });
      }
    }
    for (const race of races) {
      if (race.name.toLowerCase().includes(q) || race.circuit.toLowerCase().includes(q)) {
        out.push({ kind: 'Race', label: race.name, sub: race.circuit, onSelect: () => navigate(`/races/${race.race_id}`) });
      }
    }
    return out.slice(0, 8);
  }, [query, standings, races, navigate]);

  const closeSearch = () => { setSearchOpen(false); setQuery(''); };

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 60,
        background: scrolled ? 'rgba(6,6,8,0.82)' : 'rgba(6,6,8,0.55)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.03)',
        transform: navHidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'background 0.4s ease, border-color 0.4s ease, transform 0.3s ease',
        userSelect: 'none',
      }}
    >
      <div style={{ height: '100%', maxWidth: 1440, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

        {/* LEFT: wordmark + real next-race chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          <button
            onClick={() => navigate('/dashboard')}
            aria-label="GridLock home"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <span style={{ fontFamily: '"JetBrains Mono","IBM Plex Mono","Courier New",monospace', fontSize: 15, fontWeight: 900, letterSpacing: '-0.04em', textTransform: 'uppercase', color: '#ffffff' }}>GRID</span>
            <span style={{ fontFamily: '"JetBrains Mono","IBM Plex Mono","Courier New",monospace', fontSize: 15, fontWeight: 900, letterSpacing: '-0.04em', textTransform: 'uppercase', color: '#e10600' }}>LOCK</span>
          </button>

          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

          {liveRace && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ position: 'relative', display: 'flex', width: 7, height: 7 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#e10600', opacity: 0.5, animation: 'gl-ping 1.4s ease-out infinite' }} />
                <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: '#e10600', display: 'inline-flex' }} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e10600', letterSpacing: '0.04em' }}>
                LIVE · {liveRace.name.replace(' Grand Prix', ' GP')}
              </span>
            </div>
          )}

          {!liveRace && justFinishedRace && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', letterSpacing: '0.02em' }}>
                FINISHED · {justFinishedRace.name.replace(' Grand Prix', ' GP')}
              </span>
              <span className="hidden md:inline" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                — full results &amp; standings updating, check back in a few hours
              </span>
            </div>
          )}

          {!liveRace && !justFinishedRace && nextRace && (
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Next Race</span>
                  <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}>·</span>
                  <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>
                    {nextRace.name.replace(' Grand Prix', ' GP')} · {nextRace.circuit}
                  </span>
                </div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                  {pad(d)}<span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>d </span>
                  {pad(h)}<span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>h </span>
                  {pad(m)}<span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>m </span>
                  {pad(s)}<span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>s</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CENTRE: nav links */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {NAV_ITEMS.map(({ path, label, activeMatch }) => (
            <NavLink key={path} label={label} active={activeMatch.some(m => location.pathname.startsWith(m))} onClick={() => navigate(path)} />
          ))}
        </div>

        {/* RIGHT: search, connection status, race engineer, profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div ref={searchRef} style={{ position: 'relative' }}>
            <SearchBox
              open={searchOpen}
              query={query}
              onOpen={() => { setSearchOpen(true); requestAnimationFrame(() => searchInputRef.current?.focus()); }}
              onChange={setQuery}
              onEscape={closeSearch}
              inputRef={searchInputRef}
            />
            {searchOpen && query.trim() && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 300,
                background: 'rgba(8,8,12,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden',
                boxShadow: '0 24px 56px rgba(0,0,0,0.65)', zIndex: 100, maxHeight: 320, overflowY: 'auto',
              }}>
                {results.length === 0 ? (
                  <div style={{ padding: '14px 16px', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>No matches</div>
                ) : results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => { r.onSelect(); closeSearch(); }}
                    style={{
                      width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                      padding: '10px 14px', background: 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{r.sub}</div>
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#e10600', textTransform: 'uppercase', flexShrink: 0 }}>{r.kind}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <ConnectionDot connected={connected} />

          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)' }} />

          <RaceEngineerButton active={location.pathname.startsWith('/race-engineer')} onClick={() => navigate('/race-engineer')} />

          <div ref={profileRef} style={{ position: 'relative' }}>
            <ProfileButton open={profileOpen} onClick={() => setProfileOpen(v => !v)} />
            {profileOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 180,
                background: 'rgba(8,8,12,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden',
                boxShadow: '0 24px 56px rgba(0,0,0,0.65)', zIndex: 100,
              }}>
                <button
                  onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Signed in as</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2 }}>{username ?? 'Guest'}</div>
                </button>
                <DropdownItem
                  label="Profile & Settings"
                  onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                />
                <DropdownItem
                  label="Logout"
                  onClick={() => { localStorage.removeItem('token'); navigate('/auth'); setProfileOpen(false); }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes gl-ping { 0%{transform:scale(1);opacity:0.5} 70%,100%{transform:scale(2.5);opacity:0} }`}</style>
    </nav>
  );
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function NavLink({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', border: 'none', cursor: 'pointer', borderRadius: 8,
        padding: '0 18px', height: 60, display: 'flex', alignItems: 'center',
        fontSize: 13, fontWeight: active ? 600 : 500, letterSpacing: '0.01em',
        color: active ? '#ffffff' : hovered ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.36)',
        background: hovered && !active ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'color 0.25s ease, background 0.3s ease', whiteSpace: 'nowrap',
      }}
    >
      {label}
      {/* Always mounted so its scale/opacity animate smoothly on hover, instead of
          popping in/out — grows from the center outward rather than a hard cut. */}
      <span style={{
        position: 'absolute', bottom: 0, left: 14, right: 14, height: active ? 2 : 1.5, borderRadius: 2,
        background: active ? '#e10600' : 'rgba(255,255,255,0.55)',
        transform: active || hovered ? 'scaleX(1)' : 'scaleX(0)',
        opacity: active ? 1 : hovered ? 1 : 0,
        transformOrigin: 'center',
        transition: 'transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease, background 0.25s ease',
      }} />
    </button>
  );
}

function SearchBox({
  open, query, onOpen, onChange, onEscape, inputRef,
}: {
  open: boolean; query: string;
  onOpen: () => void; onChange: (v: string) => void; onEscape: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      onClick={onOpen}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 34,
        width: open ? 220 : 34, padding: open ? '0 12px' : 0, justifyContent: open ? 'flex-start' : 'center',
        borderRadius: 8, cursor: open ? 'text' : 'pointer', overflow: 'hidden',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        transition: 'width 0.25s ease, padding 0.25s ease',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
        <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
      </svg>
      {open && (
        <input
          ref={inputRef}
          value={query}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') onEscape(); }}
          placeholder="Search drivers, teams, races…"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#fff', minWidth: 0 }}
        />
      )}
    </div>
  );
}

function ConnectionDot({ connected }: { connected: boolean }) {
  return (
    <div
      title={connected ? 'Connected to GridLock backend' : 'Disconnected from GridLock backend'}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <span style={{ position: 'relative', display: 'flex', width: 7, height: 7 }}>
        {connected && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', opacity: 0.5, animation: 'gl-ping 1.6s ease-out infinite' }} />}
        <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: connected ? '#22c55e' : 'rgba(255,255,255,0.25)', display: 'inline-flex' }} />
      </span>
    </div>
  );
}

function RaceEngineerButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 14px',
        borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        background: active ? 'rgba(225,6,0,0.1)' : hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
        border: active ? '1px solid rgba(225,6,0,0.35)' : hovered ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.07)',
        color: active ? '#e10600' : hovered ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.42)',
        transition: 'all 0.25s ease',
      }}
    >
      <span style={{ position: 'relative', display: 'flex', width: 7, height: 7, flexShrink: 0 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#e10600', opacity: 0.4, animation: 'gl-ping 1.6s ease-out infinite' }} />
        <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: '#e10600', display: 'inline-flex' }} />
      </span>
      Race Engineer
    </button>
  );
}

function ProfileButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%',
        background: open ? 'rgba(255,255,255,0.1)' : hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
        border: open ? '1px solid rgba(255,255,255,0.2)' : hovered ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.07)',
        cursor: 'pointer', color: open || hovered ? '#ffffff' : 'rgba(255,255,255,0.6)', transition: 'all 0.25s ease',
      }}
      aria-label="User Profile"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    </button>
  );
}

function DropdownItem({ label, onClick }: { label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', padding: '9px 14px',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)',
        transition: 'background 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}

