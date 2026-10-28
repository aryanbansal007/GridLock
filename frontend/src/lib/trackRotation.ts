// Position coordinates from F1's timing data sit in an arbitrary per-circuit frame, so
// a track drawn straight from x/y comes out at a random angle. F1's own graphics
// (and FastF1's plots) turn each circuit by a fixed angle to the familiar orientation;
// these are those angles, in degrees counter-clockwise, from MultiViewer's circuit
// info (the `rotation` FastF1 exposes). Keyed by the same slug as the data folders.
//
// Circuits with no entry draw unrotated: 2026 Madring and Sepang are missing from
// MultiViewer, and "spanish_grand_prix" / "bahrain_grand_prix" are left out on purpose
// because those names have pointed at different circuits (Barcelona vs Madring,
// Sakhir vs Sepang) — an angle for one would mis-turn the other.
const TRACK_ROTATION: Record<string, number> = {
  abu_dhabi_grand_prix: 280,
  australian_grand_prix: 44,
  austrian_grand_prix: 1,
  azerbaijan_grand_prix: 357,
  barcelona_grand_prix: 303,
  belgian_grand_prix: 91,
  british_grand_prix: 92,
  canadian_grand_prix: 62,
  chinese_grand_prix: 237,
  dutch_grand_prix: 0,
  emilia_romagna_grand_prix: 0,
  hungarian_grand_prix: 40,
  italian_grand_prix: 95,
  japanese_grand_prix: 49,
  las_vegas_grand_prix: 90,
  mexico_city_grand_prix: 36,
  miami_grand_prix: 2,
  monaco_grand_prix: 315,
  qatar_grand_prix: 61,
  saudi_arabian_grand_prix: 104,
  singapore_grand_prix: 335,
  são_paulo_grand_prix: 258,
  sao_paulo_grand_prix: 258,
  united_states_grand_prix: 0,
};

export const trackRotation = (gp: string): number =>
  TRACK_ROTATION[gp.toLowerCase().trim().replace(/ /g, '_')] ?? 0;

interface Point { x: number; y: number }
interface Bounds { x_min: number; x_max: number; y_min: number; y_max: number }

// Counter-clockwise by `deg` in the data's own y-up space (the projectors flip y for
// the screen afterwards), matching FastF1's rotate().
export const rotatePoint = (x: number, y: number, deg: number): Point => {
  if (!deg) return { x, y };
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a), s = Math.sin(a);
  return { x: x * c - y * s, y: x * s + y * c };
};

// Bounds of the rotated outline, so the turned track still fills the frame. The stored
// bounds describe the unrotated track and would leave it small and off-centre.
export const rotatedBounds = (outline: Point[], deg: number, fallback: Bounds): Bounds => {
  if (!deg || outline.length === 0) return fallback;
  let x_min = Infinity, x_max = -Infinity, y_min = Infinity, y_max = -Infinity;
  for (const p of outline) {
    const r = rotatePoint(p.x, p.y, deg);
    if (r.x < x_min) x_min = r.x;
    if (r.x > x_max) x_max = r.x;
    if (r.y < y_min) y_min = r.y;
    if (r.y > y_max) y_max = r.y;
  }
  return { x_min, x_max, y_min, y_max };
};
