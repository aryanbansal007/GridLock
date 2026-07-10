import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API_BASE, logoFor } from '../lib/f1';
import { TeamLogo } from '../components/media/TeamLogo';
import { DriverAvatar } from '../components/media/DriverAvatar';

const SEASON_YEAR = 2026;
const FAV_TEAM_KEY = 'gridlock_favorite_team';
const FAV_DRIVER_KEY = 'gridlock_favorite_driver';

interface ConstructorStanding { name: string; color: string }
interface DriverStanding { abbreviation: string; name: string; team: string; team_color: string; number: string; image_url?: string }

function readUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return jwtDecode<{ username?: string; userId?: string }>(token);
  } catch {
    return null;
  }
}

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(readUser);
  const [teams, setTeams] = useState<ConstructorStanding[]>([]);
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [favTeam, setFavTeam] = useState(() => localStorage.getItem(FAV_TEAM_KEY) ?? '');
  const [favDriver, setFavDriver] = useState(() => localStorage.getItem(FAV_DRIVER_KEY) ?? '');
  const [saved, setSaved] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/season/${SEASON_YEAR}/standings`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => { setTeams(data.constructors ?? []); setDrivers(data.drivers ?? []); })
      .catch(() => {});
  }, []);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const onFavTeamChange = (name: string) => {
    const next = name === favTeam ? '' : name;
    setFavTeam(next);
    localStorage.setItem(FAV_TEAM_KEY, next);
    flashSaved();
  };

  const onFavDriverChange = (abbr: string) => {
    const next = abbr === favDriver ? '' : abbr;
    setFavDriver(next);
    localStorage.setItem(FAV_DRIVER_KEY, next);
    flashSaved();
  };

  const startEditingName = () => {
    setNameInput(user?.username ?? '');
    setNameError(null);
    setEditingName(true);
  };

  const saveUsername = async () => {
    const next = nameInput.trim();
    if (next === user?.username) { setEditingName(false); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(next)) {
      setNameError('3-20 characters: letters, numbers, underscores only.');
      return;
    }
    setNameSaving(true);
    setNameError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/username`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ username: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameError(data?.error ?? 'Failed to update username.');
        return;
      }
      localStorage.setItem('token', data.token);
      setUser(readUser());
      setEditingName(false);
      flashSaved();
    } catch {
      setNameError('Could not reach the server.');
    } finally {
      setNameSaving(false);
    }
  };

  const initial = (user?.username ?? 'G').charAt(0).toUpperCase();
  const selectedTeam = teams.find(t => t.name === favTeam);
  const selectedDriver = drivers.find(d => d.abbreviation === favDriver);
  const accentColor = selectedTeam ? `#${selectedTeam.color}` : selectedDriver ? `#${selectedDriver.team_color}` : '#e10600';

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-10 pb-20 font-sans">
      <div className="max-w-[720px] mx-auto px-6 space-y-6">

        {/* Hero card */}
        <div
          className="relative rounded-2xl border border-white/5 overflow-hidden"
          style={{ background: `linear-gradient(180deg, ${accentColor}22 0%, #0d0e12 65%)` }}
        >
          <div className="p-6 md:p-8 flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shrink-0 ring-2 ring-white/10"
              style={{ background: accentColor, boxShadow: `0 8px 32px ${accentColor}55` }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="max-w-[280px]">
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveUsername();
                        if (e.key === 'Escape') setEditingName(false);
                      }}
                      disabled={nameSaving}
                      className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-lg font-black tracking-tight text-white focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={saveUsername}
                      disabled={nameSaving}
                      className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-md bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {nameSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      disabled={nameSaving}
                      className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  {nameError && <div className="text-[11px] text-[#e10600] font-medium mt-2">{nameError}</div>}
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <div className="text-2xl font-black tracking-tight truncate">{user?.username ?? 'Guest'}</div>
                  {user && (
                    <button
                      onClick={startEditingName}
                      title="Change username"
                      className="opacity-40 hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
              <div className="text-xs text-gray-500 font-mono truncate mt-0.5">
                {user?.userId ? `ID · ${user.userId}` : 'Not signed in'}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {selectedTeam && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                    <TeamLogo src={logoFor(selectedTeam.name)} name={selectedTeam.name} color={selectedTeam.color} size={16} />
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: `#${selectedTeam.color}` }}>
                      {selectedTeam.name} Fan
                    </span>
                  </div>
                )}
                {selectedDriver && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                    <DriverAvatar src={selectedDriver.image_url} name={selectedDriver.name} teamColor={selectedDriver.team_color} size={16} />
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: `#${selectedDriver.team_color}` }}>
                      #{selectedDriver.number} {selectedDriver.name}
                    </span>
                  </div>
                )}
                {!selectedTeam && !selectedDriver && (
                  <div className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
                    Season {SEASON_YEAR}
                  </div>
                )}
              </div>
            </div>
            <span className={`text-[10px] font-bold tracking-widest uppercase transition-opacity duration-300 shrink-0 ${saved ? 'opacity-100 text-green-400' : 'opacity-0'}`}>
              ✓ Saved
            </span>
          </div>
        </div>

        {/* Favorite driver card */}
        <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-6 md:p-8">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-5 block">Favorite Driver</span>

          {drivers.length === 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-white/[0.03] animate-pulse h-[92px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {drivers.map(d => {
                const isSelected = d.abbreviation === favDriver;
                const color = `#${d.team_color}`;
                return (
                  <button
                    key={d.abbreviation}
                    onClick={() => onFavDriverChange(d.abbreviation)}
                    aria-pressed={isSelected}
                    title={d.name}
                    className="group flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl border transition-all duration-150 cursor-pointer"
                    style={{
                      background: isSelected ? `${color}1a` : 'rgba(255,255,255,0.02)',
                      borderColor: isSelected ? color : 'rgba(255,255,255,0.06)',
                      boxShadow: isSelected ? `0 0 0 1px ${color}55, 0 8px 20px ${color}33` : 'none',
                    }}
                  >
                    <DriverAvatar src={d.image_url} name={d.name} teamColor={d.team_color} size={38} />
                    <span
                      className="text-[9px] font-bold uppercase tracking-tight text-center leading-tight truncate w-full transition-colors"
                      style={{ color: isSelected ? '#fff' : '#6b7280' }}
                    >
                      {d.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Favorite team card */}
        <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-6 md:p-8">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-5 block">Favorite Team</span>

          {teams.length === 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {teams.map(t => {
                const isSelected = t.name === favTeam;
                const color = `#${t.color}`;
                return (
                  <button
                    key={t.name}
                    onClick={() => onFavTeamChange(t.name)}
                    aria-pressed={isSelected}
                    title={t.name}
                    className="group aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 p-2 border transition-all duration-150 cursor-pointer"
                    style={{
                      background: isSelected ? `${color}1a` : 'rgba(255,255,255,0.02)',
                      borderColor: isSelected ? color : 'rgba(255,255,255,0.06)',
                      boxShadow: isSelected ? `0 0 0 1px ${color}55, 0 8px 20px ${color}33` : 'none',
                    }}
                  >
                    <TeamLogo src={logoFor(t.name)} name={t.name} color={t.color} size={34} />
                    <span
                      className="text-[9px] font-bold uppercase tracking-tight text-center leading-tight truncate w-full transition-colors"
                      style={{ color: isSelected ? '#fff' : '#6b7280' }}
                    >
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Account card */}
        <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-6 md:p-8">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4 block">Account</span>
          <button
            onClick={() => { localStorage.removeItem('token'); navigate('/auth'); }}
            className="w-full bg-[#e10600]/10 border border-[#e10600]/30 hover:bg-[#e10600]/20 text-[#e10600] px-4 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
