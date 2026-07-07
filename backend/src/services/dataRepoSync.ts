import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { CACHE_DIR } from '../config/paths.js';

// Makes a public GitHub repo the durable store for everything under CACHE_DIR, so a
// host with no persistent disk (e.g. Render's free tier) doesn't need one: on boot,
// syncCacheFromRemote() clones/pulls that repo straight into CACHE_DIR before the
// server starts accepting requests; after a generation step writes new files,
// pushCacheToRemote() commits and pushes them back. No-ops entirely if
// GITHUB_DATA_TOKEN/GITHUB_DATA_REPO aren't set, so local dev (which already has a
// persistent CACHE_DIR on disk) is unaffected.
const GITHUB_DATA_TOKEN = process.env.GITHUB_DATA_TOKEN;
const GITHUB_DATA_REPO = process.env.GITHUB_DATA_REPO; // "owner/repo"

function remoteUrl(): string | null {
  if (!GITHUB_DATA_TOKEN || !GITHUB_DATA_REPO) return null;
  return `https://${GITHUB_DATA_TOKEN}@github.com/${GITHUB_DATA_REPO}.git`;
}

// Never let a git error surface the token — it's embedded in the remote URL, and
// git occasionally echoes the remote in its own error output.
function redact(message: string): string {
  return GITHUB_DATA_TOKEN ? message.split(GITHUB_DATA_TOKEN).join('***') : message;
}

export function syncCacheFromRemote(): void {
  const url = remoteUrl();
  if (!url) {
    console.log('[data-repo-sync] GITHUB_DATA_TOKEN/GITHUB_DATA_REPO not set — skipping remote cache sync.');
    return;
  }

  const gitDir = path.join(CACHE_DIR, '.git');
  try {
    if (fs.existsSync(gitDir)) {
      console.log('[data-repo-sync] Pulling latest cache from remote...');
      execSync('git pull --quiet', { cwd: CACHE_DIR, stdio: 'pipe' });
      console.log('[data-repo-sync] Pull complete.');
      return;
    }

    const hasContent = fs.existsSync(CACHE_DIR) && fs.readdirSync(CACHE_DIR).length > 0;
    if (hasContent) {
      console.log('[data-repo-sync] CACHE_DIR already has content and is not a git clone — skipping (local dev cache).');
      return;
    }

    console.log('[data-repo-sync] Cloning cache from remote (cold start)...');
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    execSync(`git clone --quiet "${url}" .`, { cwd: CACHE_DIR, stdio: 'pipe' });
    console.log('[data-repo-sync] Cache cloned successfully.');
  } catch (err: any) {
    console.error(`[data-repo-sync] Sync failed, continuing with empty/partial cache: ${redact(err.message)}`);
  }
}

export function pushCacheToRemote(message: string): void {
  if (!remoteUrl()) return;
  if (!fs.existsSync(path.join(CACHE_DIR, '.git'))) return; // local dev, or clone never happened

  try {
    execSync('git add -A', { cwd: CACHE_DIR, stdio: 'ignore' });
    const status = execSync('git status --porcelain', { cwd: CACHE_DIR }).toString();
    if (!status.trim()) return; // nothing new to push

    execSync('git config user.email "gridlock-bot@render"', { cwd: CACHE_DIR, stdio: 'ignore' });
    execSync('git config user.name "GridLock Bot"', { cwd: CACHE_DIR, stdio: 'ignore' });
    execSync(`git commit --quiet -m "${message.replace(/"/g, "'")}"`, { cwd: CACHE_DIR, stdio: 'ignore' });
    execSync('git push --quiet', { cwd: CACHE_DIR, stdio: 'pipe' });
    console.log(`[data-repo-sync] Pushed: ${message}`);
  } catch (err: any) {
    console.error(`[data-repo-sync] Push failed, local cache still updated just not synced remotely: ${redact(err.message)}`);
  }
}
