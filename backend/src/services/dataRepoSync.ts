import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { CACHE_DIR, FASTF1_CACHE_DIR } from '../config/paths.js';

// Generic git-backed sync for a directory, so a host with no persistent disk (e.g.
// Render's free tier) doesn't need one: on boot, syncFromRemote() clones/pulls the
// configured repo straight into the given dir before the server starts accepting
// requests; after new files are written, pushToRemote() commits and pushes them
// back. No-ops entirely if that repo's token/name env vars aren't set, so local dev
// (which already has persistent dirs on disk) is unaffected.
interface RepoConfig {
  label: string;
  dir: string;
  token: string | undefined;
  repo: string | undefined; // "owner/repo"
}

const CACHE_REPO: RepoConfig = {
  label: 'output-cache',
  dir: CACHE_DIR,
  token: process.env.GITHUB_DATA_TOKEN,
  repo: process.env.GITHUB_DATA_REPO,
};

// FastF1's own raw HTTP response cache — a separate repo/token (falls back to the
// same token as CACHE_REPO if a dedicated one isn't set, since a fine-grained PAT
// can be scoped to cover both repos) so it can be managed independently of the
// generated-output cache above. Persisting this fixes on-demand generation being
// extremely slow right after any restart/deploy: without it, every request for a
// not-yet-generated race has to re-fetch that race's raw timing data from FastF1's
// servers from scratch over the network — measured taking most of 10 minutes on
// Render's free tier, which was what actually killed generation (via
// runPythonGenerator's own timeout in raceService.ts), not memory or a code bug.
const FASTF1_REPO: RepoConfig = {
  label: 'fastf1-cache',
  dir: FASTF1_CACHE_DIR,
  token: process.env.GITHUB_FASTF1_CACHE_TOKEN ?? process.env.GITHUB_DATA_TOKEN,
  repo: process.env.GITHUB_FASTF1_CACHE_REPO,
};

function remoteUrl(cfg: RepoConfig): string | null {
  if (!cfg.token || !cfg.repo) return null;
  return `https://${cfg.token}@github.com/${cfg.repo}.git`;
}

// Never let a git error surface the token — it's embedded in the remote URL, and
// git occasionally echoes the remote in its own error output.
function redact(cfg: RepoConfig, message: string): string {
  return cfg.token ? message.split(cfg.token).join('***') : message;
}

function syncFromRemote(cfg: RepoConfig): void {
  const url = remoteUrl(cfg);
  if (!url) {
    console.log(`[data-repo-sync] ${cfg.label}: token/repo not set — skipping remote sync.`);
    return;
  }

  const gitDir = path.join(cfg.dir, '.git');
  try {
    if (fs.existsSync(gitDir)) {
      console.log(`[data-repo-sync] ${cfg.label}: pulling latest from remote...`);
      execSync('git pull --quiet', { cwd: cfg.dir, stdio: 'pipe' });
      console.log(`[data-repo-sync] ${cfg.label}: pull complete.`);
      return;
    }

    const hasContent = fs.existsSync(cfg.dir) && fs.readdirSync(cfg.dir).length > 0;
    if (hasContent) {
      console.log(`[data-repo-sync] ${cfg.label}: dir already has content and is not a git clone — skipping (local dev cache).`);
      return;
    }

    console.log(`[data-repo-sync] ${cfg.label}: cloning from remote (cold start)...`);
    fs.mkdirSync(cfg.dir, { recursive: true });
    execSync(`git clone --quiet "${url}" .`, { cwd: cfg.dir, stdio: 'pipe' });
    console.log(`[data-repo-sync] ${cfg.label}: cloned successfully.`);
  } catch (err: any) {
    console.error(`[data-repo-sync] ${cfg.label}: sync failed, continuing with empty/partial cache: ${redact(cfg, err.message)}`);
  }
}

function pushToRemote(cfg: RepoConfig, message: string): void {
  if (!remoteUrl(cfg)) return;
  if (!fs.existsSync(path.join(cfg.dir, '.git'))) return; // local dev, or clone never happened

  try {
    execSync('git add -A', { cwd: cfg.dir, stdio: 'ignore' });
    const status = execSync('git status --porcelain', { cwd: cfg.dir }).toString();
    if (!status.trim()) return; // nothing new to push

    execSync('git config user.email "gridlock-bot@render"', { cwd: cfg.dir, stdio: 'ignore' });
    execSync('git config user.name "GridLock Bot"', { cwd: cfg.dir, stdio: 'ignore' });
    execSync(`git commit --quiet -m "${message.replace(/"/g, "'")}"`, { cwd: cfg.dir, stdio: 'ignore' });
    execSync('git push --quiet', { cwd: cfg.dir, stdio: 'pipe' });
    console.log(`[data-repo-sync] ${cfg.label}: pushed — ${message}`);
  } catch (err: any) {
    console.error(`[data-repo-sync] ${cfg.label}: push failed, local cache still updated just not synced remotely: ${redact(cfg, err.message)}`);
  }
}

// Syncs both the output cache and FastF1's raw cache — same call site as before
// (app.ts's boot sequence), now covering both directories.
export function syncCacheFromRemote(): void {
  syncFromRemote(CACHE_REPO);
  syncFromRemote(FASTF1_REPO);
}

export function pushCacheToRemote(message: string): void {
  pushToRemote(CACHE_REPO, message);
}

// Called alongside pushCacheToRemote() after any script that invokes FastF1
// (full_race_generator.py, session_results.py, generate_season_data.py) — each of
// those may have populated new entries in FastF1's raw cache along the way.
export function pushFastF1CacheToRemote(message: string): void {
  pushToRemote(FASTF1_REPO, message);
}
