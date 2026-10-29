# Publishing a race to GridLock

How a new Grand Prix weekend gets from the F1 data feed onto gridlocks.online. You do this yourself after each race. It takes about 30 to 60 minutes per weekend, mostly waiting on downloads.

## The big picture

```
OpenF1 (free API)
    │  1. generate on YOUR laptop
    ▼
gridlock-data/            ← a separate git repo (github.com/aryanbansal007/gridlock-data)
    │  2. commit + push
    ▼
GitHub Actions: "Migrate gridlock-data to R2"
    │  3. run the workflow (blank "only")
    ▼
Cloudflare R2 bucket      ← what the website actually reads
    ▼
gridlocks.online
```

Two things to remember:

- **Generation only works on your laptop.** F1's own servers block data-centre IPs, so GitHub Actions, Render or any cloud machine can't do it. The OpenF1 scripts below use a free API that doesn't care, but keep generating locally anyway: it is rate limited to 30 requests a minute, and a laptop can wait it out.
- **Each session needs two kinds of data.** Telemetry (the simulator) and results (the classification table on the race page). Forgetting the results gives "Session data unavailable" on the race page while the simulator still works.

## What a weekend produces

| Weekend | Telemetry sessions (simulator) | Results sessions (race page tables) |
|---|---|---|
| Normal | `Q`, `R` | `FP1`, `FP2`, `FP3`, `Q`, `R` |
| Sprint | `SQ`, `S`, `Q`, `R` | `FP1`, `SQ`, `S`, `Q`, `R` |

Practice sessions have results only, no replay.

Where the files land (inside `gridlock-data/`):

```
2026/<gp_slug>/<SESSION>/          telemetry: drivers/, track.json, laps.json, conditions.json, race_control.json (+ quali.json for Q and SQ)
session_results/2026/<round>/<SESSION>.json    results table
season/2026/calendar.json, standings.json      season data (refreshed by the backend by itself)
races-index.json                   list of what has a replay (rebuilt by the workflow)
```

`<gp_slug>` is the calendar race name in lowercase with underscores: "Italian Grand Prix" becomes `italian_grand_prix`. `<round>` is the championship round number in `season/2026/calendar.json`.

## One-time setup

```bash
cd ~/Desktop/GridLock/data_scripts
python3 -m venv venv                 # skip if venv/ already exists
venv/bin/pip install -r requirements.txt
```

You also need `gridlock-data/` cloned next to the app and `gh` (GitHub CLI) logged in if you want to start the workflow from the terminal.

## Per-weekend steps

All commands run from `~/Desktop/GridLock/data_scripts`. Replace the example values.

### 1. Find the OpenF1 session keys

```bash
curl -s "https://api.openf1.org/v1/sessions?year=2026&circuit_short_name=Austin" \
  | python3 -c "import json,sys;[print(s['session_key'],s['session_name'],s['date_start'][:10]) for s in json.load(sys.stdin)]"
```

Use the key for each session you need. You can usually skip `--session-key` and let the script match by name, but pass it when the meeting name is ambiguous (for example the replacement Bahrain GP held at Sepang, where two meetings share the name).

### 2. Generate the telemetry

One command per session. The race:

```bash
venv/bin/python openf1_race_generator.py --year 2026 --gp "United States Grand Prix" \
  --session R --output-dir ../gridlock-data --cache-dir ~/of1cache
```

Qualifying (same script, it detects Q1/Q2/Q3 itself):

```bash
venv/bin/python openf1_race_generator.py --year 2026 --gp "United States Grand Prix" \
  --session Q --output-dir ../gridlock-data --cache-dir ~/of1cache
```

Session codes: `R`, `Q`, `S` (sprint), `SQ` (sprint qualifying).
Each takes roughly 3 to 6 minutes. The `--cache-dir` stores downloaded OpenF1 responses, so a re-run after a fix is fast.

`--gp` must be the calendar race name exactly, because it decides the folder name.

`race_control.json` (the FIA penalty, investigation and track-limits notices shown over the replay) is written by the same command. For a session generated earlier, add it without redoing the telemetry:

```bash
venv/bin/python openf1_race_control.py --year 2026 --data ../gridlock-data --cache-dir ~/of1cache
```

### 3. Generate the results tables

Output goes to a file named by round and session. Example for round 18:

```bash
mkdir -p ../gridlock-data/session_results/2026/18
for S in FP1 FP2 FP3 Q R; do
  venv/bin/python openf1_session_results.py --year 2026 --gp "United States Grand Prix" \
    --round 18 --session $S --cache-dir ~/of1cache \
    > ../gridlock-data/session_results/2026/18/$S.json
done
```

On a sprint weekend use `FP1 SQ S Q R` instead.

If a command fails it leaves an empty or partial file. Delete it and rerun before committing (check with `ls -l`; a good file is tens of KB).

### 4. Test it locally before publishing

Run the app against the data on your laptop. The settings below stop the local backend from pushing anything or generating on its own:

```bash
# terminal 1: backend
cd ~/Desktop/GridLock/backend
GITHUB_DATA_TOKEN= GITHUB_DATA_REPO= GITHUB_FASTF1_CACHE_TOKEN= GITHUB_FASTF1_CACHE_REPO= \
DISABLE_LIVE_GENERATION=true CACHE_DIR=$HOME/Desktop/GridLock/gridlock-data npm run dev

# terminal 2: frontend
cd ~/Desktop/GridLock/frontend && npm run dev
```

Why the blank tokens: `backend/.env` holds live GitHub tokens. Leaving them set would let a local backend push to the real data repo.

Then open `http://localhost:5173` and check:

- `/races/2026_<gp_slug>`: every session tab shows a table.
- `/simulator/2026_<gp_slug>_r` (and `_q`, `_s`, `_sq`): the replay loads and the cars move.

### 5. Commit and push the data

```bash
cd ~/Desktop/GridLock/gridlock-data
git add -A
git commit -m "Add United States GP telemetry and results"
git pull --rebase && git push
```

`git pull --rebase` matters: the backend pushes standings here every hour, so the remote usually has newer commits. If the rebase stops on a conflict in `season/2026/standings.json` or `calendar.json`, keep the remote version (`git checkout --ours <file>` during a rebase gives you the remote one), then `git add` it and `git rebase --continue`. Never keep an old standings file over a newer one unless you regenerated it on purpose.

### 6. Upload to R2

Run the workflow with `only` left **blank**. Blank is what rewrites `races-index.json`; a filtered run skips it, and the new race stays invisible in the simulator list.

From the terminal:

```bash
cd ~/Desktop/GridLock
gh workflow run "Migrate gridlock-data to R2"
gh run list --limit 1              # shows the run and its status
```

Or in the browser: GitHub → the GridLock repo → Actions → "Migrate gridlock-data to R2" → Run workflow → leave `only` empty.

It takes 2 to 8 minutes. Wait for a green tick.

### 7. Check the live site

Hard-refresh gridlocks.online (Cmd+Shift+R), open the race and click through the session tabs and Watch replay.

## Updating the app code

If you changed the website itself (not just data): commit in the main repo and push. Vercel redeploys the frontend and Render redeploys the backend by themselves. The data workflow is separate and only needed for data.

```bash
cd ~/Desktop/GridLock
git add -A && git commit -m "Describe the change" && git push
```

## What runs by itself

- **Season standings and calendar:** the Render backend rebuilds `season/<year>/calendar.json` and `standings.json` every hour, commits them to `gridlock-data`, and the R2 workflow copies them over at :20 past each hour. After a race you normally just wait for this; the new race appears in the calendar and standings.
- **Results tables** (`session_results/`) are also synced hourly by that workflow, so once they're pushed to `gridlock-data` they reach the site by themselves. Telemetry is not: it only goes up when you run the workflow with `only` blank.

To rebuild standings by hand (rare):

```bash
venv/bin/python generate_season_data.py --year 2026 --output-dir ~/scratch/seasonout --cache-dir ~/scratch/fastf1c
```

then copy `calendar.json` and `standings.json` into `gridlock-data/season/2026/`. This script still uses FastF1 for race results, so check it works before relying on it. The Render job uses the same script.

## When something goes wrong

| Symptom | Likely cause and fix |
|---|---|
| Race page says "Session data unavailable" | The results file for that session is missing or empty in `session_results/2026/<round>/`. Generate it (step 3), push, wait for the hourly sync or run the workflow. |
| Simulator list doesn't show the new race | You ran the workflow with `only` filled in. Run it again with it blank. |
| "This session hasn't been analyzed yet" | Telemetry for that session isn't in the bucket. Check that `gridlock-data/2026/<gp_slug>/<SESSION>/laps.json` exists and the workflow ran after the push. |
| Generator stops with "Rate limit exceeded" or "Connection refused" | OpenF1 allows 30 requests a minute and sometimes drops connections. Just rerun the same command; downloaded data is cached and it resumes quickly. |
| Generator says it can't pick one meeting | The name matches several meetings (the Sepang "Bahrain Grand Prix"). Pass `--session-key`. |
| Results script crashes on a position like "RT" | Already handled in the current scripts. If you see a new odd value, send me the error. |
| Cars look misplaced on the first lap | Known: OpenF1 positions are approximate at the start. The simulator's info note says so. |
| Push rejected | Someone (the backend) pushed first. `git pull --rebase` then push again. |
| Standings file conflict while rebasing | See step 5. |

## Quick checklist (copy for each race)

- [ ] Find session keys (step 1)
- [ ] Generate telemetry: `R`, `Q` (+ `S`, `SQ` on sprint weekends)
- [ ] Generate results: `FP1`, `FP2`, `FP3`, `Q`, `R` (sprint: `FP1`, `SQ`, `S`, `Q`, `R`)
- [ ] Check files are not empty, test locally
- [ ] `git add -A && git commit && git pull --rebase && git push` in `gridlock-data`
- [ ] Run "Migrate gridlock-data to R2" with `only` blank
- [ ] Hard-refresh the site and click through the sessions
