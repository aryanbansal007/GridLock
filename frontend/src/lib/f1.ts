// Shared F1 domain types + helpers used across Dashboard, Calendar, Drivers, Teams.
// Mirrors backend/src/cache/season/<year>/{standings,calendar}.json.

// Env-driven so a deployed build points at the real backend instead of localhost —
// set VITE_API_BASE in the frontend's deploy environment (e.g. Vercel project settings).
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5050';
export const SEASON_YEAR = 2026;

// Seasons the backend can serve (generated on demand via generate_season_data.py --year <y>,
// same on-demand-then-cache pattern the app already uses for race telemetry).
export const AVAILABLE_SEASONS = Array.from({ length: SEASON_YEAR - 2020 + 1 }, (_, i) => SEASON_YEAR - i)
  .map(year => ({ year, label: `${year} Season` }));

export interface DriverStanding {
  abbreviation: string;
  name: string;
  number: string;
  team: string;
  team_color: string;
  points: number;
  wins: number;
  podiums: number;
  dnfs: number;
  position: number;
  image_url?: string;
  points_last_race?: number; // points gained in the most recent completed round (Race + Sprint combined)
}

export interface ConstructorStanding {
  name: string;
  color: string;
  points: number;
  wins: number;
  podiums: number;
  position: number;
  points_last_race?: number;
}

export interface StandingsResponse {
  meta: { year: number; generated_at: string; rounds_counted: number };
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
}

export type RaceStatus = 'completed' | 'ongoing' | 'upcoming' | 'cancelled';

export interface RaceEntry {
  round: number;
  name: string;
  circuit: string;
  country: string;
  date: string;
  status: RaceStatus;
  winner: string | null;
  winner_team: string | null;
  image_url: string;
  race_id: string;
  has_sprint?: boolean; // sprint weekend? (added to calendar.json — may be absent on older caches)
  weekend_start?: string; // first session's date (usually Friday) — may be absent on older caches
  race_time?: string | null; // exact Race session start (ISO, UTC) — may be absent/null
}

export interface CalendarResponse {
  meta: { year: number; total_rounds: number; generated_at: string };
  races: RaceEntry[];
}

const FLAGS: Record<string, string> = {
  Australia: '🇦🇺', China: '🇨🇳', Japan: '🇯🇵', 'United States': '🇺🇸', Canada: '🇨🇦',
  Monaco: '🇲🇨', Spain: '🇪🇸', Austria: '🇦🇹', 'United Kingdom': '🇬🇧', Belgium: '🇧🇪',
  Hungary: '🇭🇺', Netherlands: '🇳🇱', Italy: '🇮🇹', Azerbaijan: '🇦🇿', Singapore: '🇸🇬',
  Mexico: '🇲🇽', Brazil: '🇧🇷', Qatar: '🇶🇦', 'United Arab Emirates': '🇦🇪',
  'Saudi Arabia': '🇸🇦', Bahrain: '🇧🇭', France: '🇫🇷', Russia: '🇷🇺', Turkey: '🇹🇷',
  Portugal: '🇵🇹',
};
export const flagFor = (country: string) => FLAGS[country] ?? '🏁';

// Plain white silhouettes of each team's crest/brand mark — no title sponsor
// lockups (no HP, Petronas, Oracle, Aramco, BWT, TGR, Visa/Cash App, etc), and no
// baked-in brand color either, since TeamLogo now draws its own team-color circle
// behind them. Hosted locally (public/team-logos) since Wikipedia only maintains
// the current sponsored lockup, not a stripped one — these were cropped from those
// source assets and recolored to solid white. Keyed by the exact TeamName string
// FastF1 returns (varies by year/rebrand — RB/Racing Bulls, Kick Sauber, etc).
const TEAM_LOGOS: Record<string, string> = {
  Ferrari: '/team-logos/ferrari.png',
  Mercedes: '/team-logos/mercedes-white.png',
  McLaren: '/team-logos/mclaren-white.png',
  'Red Bull Racing': '/team-logos/red-bull-racing-white.png',
  Williams: '/team-logos/williams.png',
  'Aston Martin': '/team-logos/aston-martin.png',
  Alpine: '/team-logos/alpine.png',
  'Haas F1 Team': '/team-logos/haas.png',
  'Racing Bulls': '/team-logos/racing-bulls-white.png',
  RB: '/team-logos/racing-bulls.png',
  AlphaTauri: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Scuderia_Alpha-Tauri.svg/500px-Scuderia_Alpha-Tauri.svg.png',
  Audi: '/team-logos/audi-white.png',
  'Kick Sauber': 'https://upload.wikimedia.org/wikipedia/commons/9/94/Logo_sauber_2023.jpg',
  'Alfa Romeo Racing': 'https://upload.wikimedia.org/wikipedia/en/2/2a/Alfa_Romeo_logo.png',
  'Alfa Romeo': 'https://upload.wikimedia.org/wikipedia/en/2/2a/Alfa_Romeo_logo.png',
  Cadillac: '/team-logos/cadillac-white.png',
  'Racing Point': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/BWT_Racing_Point_Logo.svg/960px-BWT_Racing_Point_Logo.svg.png',
  Renault: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/Renault_F1_Team_logo_2019.svg/960px-Renault_F1_Team_logo_2019.svg.png',
};
export const logoFor = (teamName: string) => TEAM_LOGOS[teamName] ?? '';

export const pad = (n: number) => String(n).padStart(2, '0');

export const shortName = (raceName: string) => raceName.replace(' Grand Prix', ' GP');

export const fmtDateShort = (iso: string) =>
  new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })
    .toUpperCase();

export const fmtDateFull = (iso: string) =>
  new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .toUpperCase();

// Race weekend range, e.g. "Jul 17 - Jul 19" (or "Jul 17 - 19" when both ends
// share a month). Falls back to a single formatted date if start is missing/equal.
export function fmtWeekendRange(startIso: string | undefined, endIso: string) {
  if (!startIso || startIso === endIso) {
    return new Date(`${endIso}T00:00:00Z`)
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  const startMonth = start.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
  const endMonth = end.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
  const startDay = start.toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'UTC' });
  const endDay = end.toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'UTC' });
  const year = end.toLocaleDateString('en-GB', { year: 'numeric', timeZone: 'UTC' });
  if (startMonth === endMonth) return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}

// Blend a hex color (no '#') toward white — used to differentiate two same-team drivers.
export function lighten(hex: string, amount: number) {
  const n = parseInt(hex, 16);
  const r = Math.min(255, ((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * amount);
  const g = Math.min(255, ((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * amount);
  const b = Math.min(255, (n & 255) + (255 - (n & 255)) * amount);
  return `#${[r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

export const driverInitials = (name: string) =>
  name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
