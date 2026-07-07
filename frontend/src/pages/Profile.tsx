import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API_BASE } from '../lib/f1';

const SEASON_YEAR = 2026;

const FAV_TEAM_KEY = 'gridlock_favorite_team';
const NOTIF_RACE_KEY = 'gridlock_notif_race_reminders';
const NOTIF_STANDINGS_KEY = 'gridlock_notif_standings';

interface ConstructorStanding { name: string; color: string }

export default function Profile() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return jwtDecode<{ username?: string; userId?: string }>(token);
    } catch {
      return null;
    }
  }, []);

  const [teams, setTeams] = useState<ConstructorStanding[]>([]);
  const [favTeam, setFavTeam] = useState(() => localStorage.getItem(FAV_TEAM_KEY) ?? '');
  const [notifRace, setNotifRace] = useState(() => localStorage.getItem(NOTIF_RACE_KEY) !== 'false');
  const [notifStandings, setNotifStandings] = useState(() => localStorage.getItem(NOTIF_STANDINGS_KEY) === 'true');
  const [saved, setSaved] = useState(false);

  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    fetch(`${API_BASE}/api/season/${SEASON_YEAR}/standings`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setTeams(data.constructors ?? []))
      .catch(() => {});

    fetch(`${API_BASE}/health`)
      .then(res => setBackendStatus(res.ok ? 'online' : 'offline'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const onFavTeamChange = (name: string) => {
    setFavTeam(name);
    localStorage.setItem(FAV_TEAM_KEY, name);
    flashSaved();
  };
  const onToggleNotifRace = () => {
    const next = !notifRace;
    setNotifRace(next);
    localStorage.setItem(NOTIF_RACE_KEY, String(next));
    flashSaved();
  };
  const onToggleNotifStandings = () => {
    const next = !notifStandings;
    setNotifStandings(next);
    localStorage.setItem(NOTIF_STANDINGS_KEY, String(next));
    flashSaved();
  };

  const initial = (user?.username ?? 'G').charAt(0).toUpperCase();
  const selectedTeam = teams.find(t => t.name === favTeam);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-10 pb-20 font-sans">
      <div className="max-w-[720px] mx-auto px-6 space-y-6">

        {/* Header card */}
        <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-6 md:p-8 flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shrink-0"
            style={{
              background: selectedTeam ? `#${selectedTeam.color}` : '#e10600',
              boxShadow: `0 0 24px ${selectedTeam ? `#${selectedTeam.color}` : '#e10600'}66`,
            }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold truncate">{user?.username ?? 'Guest'}</div>
            <div className="text-xs text-gray-500 font-mono truncate">{user?.userId ? `ID · ${user.userId}` : 'Not signed in'}</div>
            {selectedTeam && (
              <div className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: `#${selectedTeam.color}` }}>
                {selectedTeam.name} Fan
              </div>
            )}
          </div>
        </div>

        {/* Preferences card */}
        <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">Preferences</span>
            <span className={`text-[10px] font-bold tracking-widest uppercase transition-opacity duration-300 ${saved ? 'opacity-100 text-green-400' : 'opacity-0'}`}>
              ✓ Saved
            </span>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Favorite Team</label>
            <select
              value={favTeam}
              onChange={e => onFavTeamChange(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
            >
              <option value="">No preference</option>
              {teams.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <ToggleRow
              label="Race start reminders"
              sub="Get notified as a race weekend approaches"
              checked={notifRace}
              onChange={onToggleNotifRace}
            />
            <ToggleRow
              label="Standings updates"
              sub="Get notified when the championship order changes"
              checked={notifStandings}
              onChange={onToggleNotifStandings}
            />
          </div>
        </div>

        {/* Session card */}
        <div className="rounded-2xl bg-[#0d0e12] border border-white/5 p-6 md:p-8">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4 block">Session</span>
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-400">Backend connection</span>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: backendStatus === 'online' ? '#22c55e' : backendStatus === 'offline' ? '#e10600' : '#6b7280' }}
              />
              <span style={{ color: backendStatus === 'online' ? '#22c55e' : backendStatus === 'offline' ? '#e10600' : '#9ca3af' }}>
                {backendStatus === 'checking' ? 'Checking…' : backendStatus === 'online' ? 'Online' : 'Unreachable'}
              </span>
            </span>
          </div>
          <button
            onClick={() => { localStorage.removeItem('token'); navigate('/auth'); }}
            className="w-full bg-[#e10600]/10 border border-[#e10600]/30 hover:bg-[#e10600]/20 text-[#e10600] px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-gray-500">{sub}</div>
      </div>
      <button
        onClick={onChange}
        aria-pressed={checked}
        className="relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200"
        style={{ background: checked ? '#e10600' : 'rgba(255,255,255,0.12)' }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200"
          style={{ left: checked ? 22 : 2 }}
        />
      </button>
    </div>
  );
}
