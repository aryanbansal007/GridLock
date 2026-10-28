// Local driver photos. Anything dropped in src/assets/drivers/ is bundled and matched to a
// driver by file name, so adding or swapping a photo is just a file copy (see the README
// there). Matching is forgiving on purpose — the files come from whatever source the
// pictures were saved from — and tries, in order: driver code, racing number, full name
// ("Kimi Antonelli", either order), surname.
const FILES = import.meta.glob('../assets/drivers/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const BY_KEY: Record<string, string> = {};
for (const [path, url] of Object.entries(FILES)) {
  const base = path.split('/').pop()!.replace(/\.[^.]+$/, '');
  BY_KEY[norm(base)] = url;
}

export const hasLocalDriverPhotos = Object.keys(BY_KEY).length > 0;

/** Bundled photo URL for a driver, or undefined when no file matches. */
export function localDriverPhoto(opts: { abbr?: string; name?: string; number?: string | number }): string | undefined {
  const keys: string[] = [];
  if (opts.abbr) keys.push(norm(opts.abbr));
  if (opts.number != null && String(opts.number) !== '') keys.push(norm(String(opts.number)));
  if (opts.name) {
    const parts = opts.name.trim().split(/\s+/);
    keys.push(norm(opts.name));
    if (parts.length > 1) {
      keys.push(norm(`${parts[parts.length - 1]} ${parts.slice(0, -1).join(' ')}`));
      keys.push(norm(parts[parts.length - 1]));
    }
  }
  for (const k of keys) if (k && BY_KEY[k]) return BY_KEY[k];
  return undefined;
}
