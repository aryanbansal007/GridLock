# 🏎️ GridLock

**GridLock** is a full-stack Formula 1 analytics platform that turns raw, official F1 timing
data into an interactive, race-engineer-grade experience — lap-by-lap telemetry comparison,
a full race replay simulator, live standings, and an AI assistant that can talk you through
any session.

Everything you see — every lap time, every speed trace, every corner marker — is derived from
real FastF1 telemetry, not mocked or hand-authored data.

---

## What it does

### 📊 Dashboard & Standings
A live season overview: driver and constructor standings, the current championship battle,
and quick links into the rest of the app. Standings refresh automatically on an hourly cycle
so the app never shows stale season data.

### 📅 Race Calendar & Results
Every round of a season, with weekend format (Sprint vs. standard), completion status, and
the race winner at a glance. Selecting a race opens a full results breakdown — grid position,
finishing position, points, status (finished/DNF/DSQ), and qualifying times — plus a fastest-lap
banner for race and sprint sessions.

### 🔬 Analysis Suite
The heart of GridLock. Pick any session from any cached race and drill into:

- **Telemetry Comparison** — overlay Speed, Throttle, Brake, Gear, RPM, and DRS traces for
  multiple drivers on a shared track-distance axis, with real corner markers pulled from
  FastF1's circuit info. A Speed Delta chart shows exactly where one driver is gaining or
  losing time against another.
- **Driving State** — a distance-based strip showing full-throttle, braking, cornering, and
  lift-and-coast segments for each driver, so you can see *how* a lap was driven, not just
  how fast.
- **Lap Simulation** — a top-down animated replay of a single lap, cars moving in real time
  along the actual track outline.
- **Position Chart** — race-long track position for every driver, lap by lap.
- **Track Dominance** — who's fastest through which sector of the lap.
- **Tyre Strategy** — stint lengths, compounds, and pit stop timing for the whole field.
- **Lap Times** — a sortable table of every lap, with personal-best and session-best highlighting.

Any lap can be selected — not just the fastest — and Qualifying sessions are broken down into
Q1/Q2/Q3 segments automatically.

### 🏁 Live Simulator
A full race replay: every car's real position, tyre compound, pit stops, and track status
(safety car, red flag, etc.) reconstructed from telemetry and played back on a scrubbable
timeline, with a live leaderboard that updates exactly as it did on the day.

### 🤖 Race Engineer
An AI assistant (powered by Google's Gemini) that has access to the actual results, standings,
and race context for whichever race you're viewing — ask it about strategy calls, incidents,
or "why did X beat Y today?" and it answers from the real data, not general F1 trivia.

### 👤 Accounts
Standard email/password auth (JWT-based) with a profile page, so chat history with the Race
Engineer persists per user.

---

## How it works

GridLock is three cooperating pieces:

```
┌─────────────────┐      ┌──────────────────┐      ┌────────────────────────┐
│   Python data    │ ---> │   JSON file       │ ---> │   Node/Express API      │
│   pipeline       │      │   cache on disk   │      │   (reads + serves it)   │
│  (FastF1)        │      │                   │      │                          │
└─────────────────┘      └──────────────────┘      └───────────┬────────────┘
                                                                  │ REST
                                                                  ▼
                                                        ┌──────────────────────┐
                                                        │  React frontend       │
                                                        │  (Vite + Tailwind)    │
                                                        └──────────────────────┘
```

1. **The data pipeline** (`data_scripts/`) uses [FastF1](https://docs.fastf1.dev/), a Python
   library that pulls official F1 timing data (car telemetry, lap times, weather, track status,
   circuit layout) straight from the same feed F1's own broadcast graphics use.
   - `full_race_generator.py` is the core script: given a year/Grand Prix/session, it downloads
     the session, reconstructs per-driver telemetry (speed, throttle, brake, gear, RPM, DRS,
     position) onto a shared timeline, and writes it out as a set of JSON files — one per
     driver, plus a track outline, a session-wide lap table, and a flag/weather timeline.
   - `generate_season_data.py` builds the season-wide standings and calendar.
   - `session_results.py` builds the classified results table for a single session.
   - `openf1_race_generator.py` and `openf1_session_results.py` are drop-in replacements for the
     two scripts above that read from [OpenF1](https://openf1.org) instead (free, no login) and
     write the same files. Use them for races from October 2026 on: F1 put its livetiming feed
     behind an F1TV login, so FastF1 can no longer load new sessions without one. Race and
     Sprint only. When a meeting name matches more than one event (2026 has two "Bahrain Grand
     Prix"), pass `--session-key`.
   - `get_schedule.py` fetches a season's race calendar.

2. **The backend** (`backend/`, Node + Express + TypeScript) never talks to FastF1 directly —
   it reads whatever's already been generated to disk, and only invokes the Python pipeline
   on demand when something is requested that hasn't been generated yet (a "cache miss").
   Once generated, a race stays on disk and is served instantly from then on. Auth, user
   profiles, and Race Engineer chat history are the only things backed by MongoDB — every
   analytics/telemetry route is pure file-based caching.

3. **The frontend** (`frontend/`, React 19 + Vite + TypeScript + Tailwind) is a single-page
   app that consumes the backend's REST API. Charts are built with
   [Recharts](https://recharts.org/); the live simulator and lap-simulation replay use raw SVG
   driven by React state.

Because generation happens once per race/session and is then cached indefinitely, the very
first person to open a given race's Analysis page "pays" a real wait (FastF1 has to actually
fetch and process the session — this can take a couple of minutes for a full race), and every
subsequent view of that same race is instant.

---

## Project structure

```
GridLock/
├── backend/                 # Express API (TypeScript)
│   ├── src/
│   │   ├── routes/          # /api/... endpoint definitions
│   │   ├── controllers/     # request handlers
│   │   ├── services/        # business logic (Python invocation, Gemini, scheduling)
│   │   ├── models/          # MongoDB schemas (User, Chat)
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── config/          # env-driven paths/config
│   │   └── cache/           # generated JSON lives here (season data + per-race telemetry)
│   └── package.json
├── frontend/                 # React SPA (TypeScript + Vite + Tailwind)
│   └── src/
│       ├── pages/            # one file/folder per route (Dashboard, Calendar, Analysis, ...)
│       │   ├── Analysis/     # the telemetry/analysis suite
│       │   └── Simulator/    # the live race replay
│       ├── components/       # shared UI (nav, cards, charts helpers)
│       └── lib/              # typed API client helpers
├── data_scripts/             # Python data pipeline
│   ├── full_race_generator.py
│   ├── generate_season_data.py
│   ├── session_results.py
│   ├── get_schedule.py
│   ├── requirements.txt
│   └── fastf1_cache/         # FastF1's own raw HTTP cache (auto-populated)
└── README.md
```

---

## Running it locally

### Prerequisites

| Tool | Version | Used for |
|---|---|---|
| [Node.js](https://nodejs.org/) | 22+ | Backend + frontend |
| [Python](https://www.python.org/) | 3.13+ | The FastF1 data pipeline |
| [MongoDB](https://www.mongodb.com/try/download/community) | any recent version, running locally or via [Atlas](https://www.mongodb.com/atlas) | Auth + Race Engineer chat history |
| A [Gemini API key](https://ai.google.dev/) | — | Powers the Race Engineer assistant (optional — everything else works without it) |

### 1. Clone and install

```bash
git clone <this-repo>
cd GridLock

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Python data pipeline
cd data_scripts
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Then edit `backend/.env`:

| Variable | Required? | Notes |
|---|---|---|
| `MONGO_URI` | For auth/chat | e.g. `mongodb://localhost:27017/gridlock` |
| `JWT_SECRET` | For auth | any long random string |
| `GEMINI_API_KEY` | For Race Engineer | leave blank to disable just that feature |
| `FRONTEND_ORIGIN` | No | defaults to the local Vite dev origin |
| `PORT` | No | defaults to `5050` |
| `CURRENT_SEASON` | No | defaults to `2026` |
| `PYTHON_BIN` | No | defaults to `data_scripts/venv/bin/python` |
| `CACHE_DIR` / `FASTF1_CACHE_DIR` | No | default to folders inside the repo |

Everything not marked "Required" degrades gracefully rather than crashing the app — e.g. with
no Mongo connection, standings/calendar/analysis pages still work fine, only auth and the Race
Engineer chat are unavailable.

`frontend/.env.local` just needs `VITE_API_BASE=http://localhost:5050` (already the default).

### 3. Run it

Three processes, each in its own terminal:

```bash
# Terminal 1 — backend API
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev

# MongoDB, if not already running as a service
mongod
```

Open **http://localhost:5173**, register an account, and you're in. The Python pipeline
doesn't need to be run manually — the backend invokes it automatically the first time you
request a race/session that hasn't been generated yet.

### First-time generation

The first time you open **Analysis** or the **Live Simulator** for a given race, GridLock has
to actually process that session — this takes anywhere from a few seconds (a short practice
session) to a couple of minutes (a full race with 20 cars). A loading state shows while this
happens. Every subsequent visit to that same race is instant, since the result is cached to
disk under `backend/src/cache/`.

---

## A few implementation details worth knowing

- **Track-distance alignment, not time alignment.** Telemetry Comparison charts align every
  driver by distance around the lap rather than elapsed time — this is what makes it possible
  to directly compare "who's faster into Turn 3" rather than just "who's faster at the 47-second
  mark."
- **Corner markers are real.** Corner numbers and their positions come from FastF1's own
  `get_circuit_info()`, not estimated — they line up with the actual circuit layout for that
  session.
- **DRS decoding.** FastF1's raw DRS channel reports several intermediate "detected/available"
  states; GridLock treats only the values that mean the flap is actually open as "DRS active."
- **Driving-state classification** (full throttle / braking / cornering / lift-and-coast) is
  inferred from throttle, brake, and proximity to a known corner — FastF1 doesn't expose a
  direct steering-angle channel, so this is a heuristic, not a raw telemetry read.
