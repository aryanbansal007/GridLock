import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes & Modules
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import historyRoutes from './routes/history.js';
import raceRoutes from './routes/raceRoutes.js'; // 🏎️ NEW ROUTE
import standingsRoute from './routes/standings.js';
import calendarRoute from './routes/calendar.js';
import sessionResultsRoute from './routes/sessionResults.js';

import { connectDB } from './config/db.js';
import { startSeasonDataScheduler } from './services/seasonDataScheduler.js';
import { syncCacheFromRemote } from './services/dataRepoSync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware. FRONTEND_ORIGIN is comma-separated for multiple allowed origins
// (e.g. a Vercel production domain + preview deployments); falls back to the
// local dev origins when unset.
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, methods: ["GET", "POST"], credentials: true }));
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', historyRoutes);
app.use('/api/races', raceRoutes); // 🏎️ WIRED UP
app.use('/api/season', standingsRoute);
app.use('/api/season', calendarRoute);
app.use('/api/session-results', sessionResultsRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'GridLock Paddock connection clear.' });
});

// Start Server. connectDB() logs and resolves (doesn't throw/exit) on failure —
// Mongo only backs auth + Race Engineer chat history, so a Mongo outage shouldn't
// take down standings/calendar/analysis, which have zero Mongo dependency.
// The port is bound FIRST, before any slow startup work. Hosts like Render kill a
// container that hasn't opened a port within their scan window, and the cache clone
// below outgrew that window as the data repo grew (~670MB) — producing a restart
// loop where every attempt re-cloned from scratch and timed out again. Binding first
// means the platform sees a live service immediately; the cache then hydrates in the
// background, and a race that hasn't synced yet returns the normal "not available"
// response until it lands, instead of the whole service being dead.
const startServer = () => {
  app.listen(PORT, async () => {
    console.log(`🏎️  GridLock Backend roaring at http://localhost:${PORT}`);
    connectDB();
    // Awaited before the scheduler starts: the scheduler writes into CACHE_DIR, and
    // syncFromRemote deliberately skips cloning into a directory that already has
    // content — so letting it run first would permanently prevent the clone.
    await syncCacheFromRemote();
    startSeasonDataScheduler();
  });
};

startServer();