# GridLock backend image — Node (Express API) + Python (FastF1 data pipeline)
# in one container, since the backend shells out to the Python scripts in
# data_scripts/ to generate telemetry/standings on demand and on a schedule.
#
# This only builds/runs the BACKEND. The frontend is a separate static build
# (deploy it to Vercel/Netlify/Cloudflare Pages instead — see frontend/.env.example
# for the VITE_API_BASE it needs pointed at wherever this image ends up running).
#
# Build:  docker build -t gridlock-backend .
# Run:    docker run -p 5050:5050 --env-file backend/.env -v gridlock-data:/data gridlock-backend
#
# The -v flag above is the important part: /data is where this image expects a
# PERSISTENT volume to be mounted (Render "disk", Railway "volume", or a plain
# `docker volume`) — without it, every restart/redeploy wipes the generated
# season/telemetry cache and FastF1's own HTTP cache, and you'd start from zero
# every time. See CACHE_DIR/FASTF1_CACHE_DIR below.

FROM python:3.13-slim

# ── Install Node.js 22 on top of the Python base image ──────────────────────
# (build-essential is needed because a couple of the Python deps — cryptography,
# in particular — compile native extensions on install.)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg build-essential \
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
# Mount your platform's persistent volume at /data — these two paths are where
# the generated JSON cache and FastF1's own raw telemetry cache are read/written.
ENV CACHE_DIR=/data/cache
ENV FASTF1_CACHE_DIR=/data/fastf1_cache

EXPOSE 5050
WORKDIR /app/backend
CMD ["node", "dist/app.js"]
