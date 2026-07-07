# GridLock backend image — Node (Express API) + Python (FastF1 data pipeline)
# in one container, since the backend shells out to the Python scripts in
# data_scripts/ to generate telemetry/standings on demand and on a schedule.
#
# This only builds/runs the BACKEND. The frontend is a separate static build
# (deploy it to Vercel/Netlify/Cloudflare Pages instead — see frontend/.env.example
# for the VITE_API_BASE it needs pointed at wherever this image ends up running).
#
# Build:  docker build -t gridlock-backend .
# Run:    docker run -p 5050:5050 --env-file backend/.env gridlock-backend
#
# No persistent volume needed. This image runs on a free/ephemeral-disk host (e.g.
# Render's free tier) — CACHE_DIR/FASTF1_CACHE_DIR live on the container's own
# writable filesystem and reset on every restart, same as any of its other files.
# Persistence instead comes from `backend/src/services/dataRepoSync.ts`: on boot it
# clones a public "gridlock-data" GitHub repo straight into CACHE_DIR (so a cold
# start still comes up already warm with everything ever generated), and after each
# new generation it commits + pushes the new files back to that repo. Requires
# `GITHUB_DATA_TOKEN` (a fine-grained PAT scoped to that one repo, contents:
# read+write) and `GITHUB_DATA_REPO` (`owner/repo`) set as env vars on the host —
# without them this step just no-ops and the app behaves like a plain ephemeral
# cache (still correct, just cold on every restart).

FROM python:3.13-slim

# ── Install Node.js 22 + git on top of the Python base image ────────────────
# (build-essential is needed because a couple of the Python deps — cryptography,
# in particular — compile native extensions on install. git is needed for the
# boot-time cache clone described above, not for anything build-related.)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg build-essential git \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python dependencies (copied first so this layer is cached unless
#    requirements.txt itself changes — avoids reinstalling on every code edit) ──
COPY data_scripts/requirements.txt data_scripts/requirements.txt
RUN python -m venv data_scripts/venv \
    && data_scripts/venv/bin/pip install --no-cache-dir --upgrade pip \
    && data_scripts/venv/bin/pip install --no-cache-dir -r data_scripts/requirements.txt

# ── Node dependencies (same caching idea — package*.json copied before source) ──
COPY backend/package.json backend/package-lock.json backend/
RUN cd backend && npm ci

# ── Now copy the actual source and build the TypeScript ──────────────────────
COPY data_scripts data_scripts
COPY backend backend
RUN cd backend && npm run build

ENV NODE_ENV=production
ENV PORT=5050
ENV PYTHON_BIN=/app/data_scripts/venv/bin/python
# Plain paths on the container's own (ephemeral) filesystem — no volume mount
# needed. CACHE_DIR's persistence comes from dataRepoSync.ts (see header comment).
ENV CACHE_DIR=/app/cache
ENV FASTF1_CACHE_DIR=/app/fastf1_cache

EXPOSE 5050
WORKDIR /app/backend
CMD ["node", "dist/app.js"]
