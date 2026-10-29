// Audi and Ferrari were nearly the same red (#F50537 vs #ED1131), so Audi is drawn in a
// lighter red (red with a touch of white) everywhere. The old value is baked into the generated data (standings,
// results, per-session manifests and driver files), which is large and already published, so
// it is swapped as each JSON response is read instead of rewriting every file.
const TEAM_COLOR_OVERRIDES: [RegExp, string][] = [
  [/F50537/gi, 'FF6B6B'], // Audi
];

const parseJson = Response.prototype.json;

Response.prototype.json = async function patchedJson(this: Response) {
  const text = await this.text();
  let fixed = text;
  for (const [from, to] of TEAM_COLOR_OVERRIDES) fixed = fixed.replace(from, to);
  return JSON.parse(fixed);
};

// Kept so a future caller can opt out, e.g. when debugging raw data.
export const rawJson = parseJson;
