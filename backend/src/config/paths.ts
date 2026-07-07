import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This file lives at backend/src/config/paths.ts in dev (run directly via `tsx`) or
// backend/dist/config/paths.js in production (`node dist/app.js`) — both are exactly
// 2 directories deep from backend/, so going up 2 levels always lands at backend/
// regardless of which one is actually executing. The cache itself only ever
// physically exists on disk under backend/src/cache — it's never duplicated into
// dist/ by the build — so we explicitly descend back into 'src/cache' rather than
// a plain '../cache' (which resolves to backend/dist/cache under the compiled
// build, a directory that doesn't exist). This is the bug that made standings.ts/
// calendar.ts's OLD process.cwd()-based paths look "more fragile" than the
// __dirname-based ones elsewhere — those actually had the same fragility, just
// hidden until something was ever run from the compiled dist/ build.
const BACKEND_ROOT = path.join(__dirname, '../../');
const REPO_ROOT = path.join(BACKEND_ROOT, '../');

export const CACHE_DIR = process.env.CACHE_DIR || path.join(BACKEND_ROOT, 'src/cache');
export const FASTF1_CACHE_DIR = process.env.FASTF1_CACHE_DIR || path.join(REPO_ROOT, 'data_scripts/fastf1_cache');
export const SCRIPT_DIR = path.join(REPO_ROOT, 'data_scripts');
export const PYTHON_BIN = process.env.PYTHON_BIN || path.join(SCRIPT_DIR, 'venv/bin/python');
