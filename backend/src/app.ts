// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import mongoose from 'mongoose';
// import { exec } from 'child_process';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import fs from 'fs'; // 🏎️ Added for checking file cache availability

// // Routes & Modules
// import aiRoutes from './routes/ai.js';
// import authRoutes from './routes/auth.js';
// import historyRoutes from './routes/history.js';
// import { setupPaddockSocket } from './sockets/paddockSocket.js';
// import { connectDB } from './config/db.js';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5050;

// // ES Module fix for __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Middleware
// const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
// app.use(cors({ origin: allowedOrigins, methods: ["GET", "POST"], credentials: true }));
// app.use(express.json());

// // ----------------------------------------------------------------------
// // UPDATED: Python Telemetry Generator Route with Cache Verification
// // ----------------------------------------------------------------------
// app.post('/api/generate-race', (req, res) => {
//   const { year, gp, session } = req.body;

//   // Format naming conventions to match file outcomes
//   const safeGpName = gp.toLowerCase().replace(/ /g, "_");
//   const raceId = `${year}_${safeGpName}_${session.toLowerCase()}`;
//   const fileName = `${raceId}.json`;

//   // Define paths matching your project directory layout
//   const scriptDir = path.join(__dirname, '../../data_scripts');
//   const scriptPath = path.join(scriptDir, 'full_race_generator.py');
//   const publicRacesDir = path.join(__dirname, '../../frontend/public/races');
//   const targetFilePath = path.join(publicRacesDir, fileName);

//   // 1. CACHE CHECK: If file already exists in frontend/public/races, skip generation
//   if (fs.existsSync(targetFilePath)) {
//     console.log(`⚡ Cache Hit: ${fileName} found inside frontend/public/races. Skipping Python processing.`);
//     return res.json({ success: true, raceId: raceId, cached: true });
//   }

//   // 2. CACHE MISS: Execute telemetry calculation script
//   const pythonExecutable = "/Users/heisenberg/Desktop/GridLock/data_scripts/venv/bin/python";
//   const command = `"${pythonExecutable}" "${scriptPath}" --year ${year} --gp "${gp}" --session ${session}`;

//   console.log(`⏳ Cache Miss: Generating telemetry via execution: ${command}`);

//   // Passing cwd ensures any stray relative paths stay locked to data_scripts
//   exec(command, { cwd: scriptDir }, (error, stdout, stderr) => {
//     if (error) {
//       console.error(`Error generating telemetry: ${error.message}`);
//       console.error(`stderr: ${stderr}`);
//       return res.status(500).json({ error: "Failed to generate race data. Check backend logs." });
//     }

//     console.log(`Python Output: ${stdout}`);

//     // Return confirmation to React
//     res.json({ success: true, raceId: raceId, cached: false });
//   });
// });
// // ----------------------------------------------------------------------

// // Existing Routes
// app.use('/api/ai', aiRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api', historyRoutes);

// app.get('/health', (req, res) => {
//   res.json({ status: 'GridLock Paddock connection clear.' });
// });

// // Server & Socket Setup
// const httpServer = createServer(app);
// const io = new Server(httpServer, {
//   cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true }
// });

// // Initialize the modular socket logic
// setupPaddockSocket(io);

// // Start Server
// const startServer = async () => {
//   try {
//     await connectDB(); // This handles the Mongoose connection
//     httpServer.listen(PORT, () => {
//       console.log(`🏎️  GridLock Backend roaring at http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error("Failed to start server:", error);
//   }
// };

// startServer();

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Routes & Modules
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import historyRoutes from './routes/history.js';
import raceRoutes from './routes/raceRoutes.js'; // 🏎️ NEW ROUTE
import { setupPaddockSocket } from './sockets/paddockSocket.js';
import { connectDB } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
app.use(cors({ origin: allowedOrigins, methods: ["GET", "POST"], credentials: true }));
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', historyRoutes);
app.use('/api/races', raceRoutes); // 🏎️ WIRED UP

app.get('/health', (req, res) => {
  res.json({ status: 'GridLock Paddock connection clear.' });
});

// Server & Socket Setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true }
});

setupPaddockSocket(io);

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`🏎️  GridLock Backend roaring at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();