// // import express from 'express';
// // import cors from 'cors';
// // import dotenv from 'dotenv';
// // import aiRoutes from './routes/ai.js';

// // dotenv.config();

// // const app = express();
// // const PORT = process.env.PORT || 5000;

// // // Middleware
// // app.use(cors());
// // app.use(express.json());

// // // Routes
// // app.use('/api/ai', aiRoutes);

// // // Base Health Check
// // app.get('/health', (req, res) => {
// //   res.json({ status: 'GridLock Paddock connection clear.' });
// // });

// // app.listen(PORT, () => {
// //   console.log(`🏎️  GridLock Backend roaring at http://localhost:${PORT}`);
// // });

// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { createServer } from 'http'; // Added for Socket.io
// import { Server } from 'socket.io'; // Added for Socket.io
// import aiRoutes from './routes/ai.js';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use('/api/ai', aiRoutes);

// // Base Health Check
// app.get('/health', (req, res) => {
//   res.json({ status: 'GridLock Paddock connection clear.' });
// });

// // ==========================================
// // SOCKET.IO SETUP
// // ==========================================

// // 1. Create an HTTP server wrapping the Express app
// const httpServer = createServer(app);

// // 2. Initialize Socket.io with CORS allowing your Vite frontend
// const io = new Server(httpServer, {
//   cors: {
//     origin: "*", // Default Vite port
//     methods: ["GET", "POST"]
//   }
// });

// // 3. Listen for socket connections
// io.on('connection', (socket) => {
//   console.log(`🟢 Paddock connection established: ${socket.id}`);

//   // Listen for public messages from the client
//   socket.on('send_message', (data) => {
//     // Broadcast the message to everyone connected
//     io.emit('receive_message', data);
//   });

//   // (Reserved for future Private Messaging logic)

//   socket.on('disconnect', () => {
//     console.log(`🔴 Paddock connection lost: ${socket.id}`);
//   });
// });

// // 4. IMPORTANT: Use httpServer.listen instead of app.listen
// httpServer.listen(PORT, () => {
//   console.log(`🏎️  GridLock Backend roaring at http://localhost:${PORT}`);
// });

// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import aiRoutes from './routes/ai.js';
// import { connectDB } from './config/db.js';

// // Connect to DB then start the server
// connectDB().then(() => {
//   httpServer.listen(PORT, () => {
//     console.log(`🏎️  GridLock Backend roaring at http://localhost:${PORT}`);
//   });
// });


// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5050;

// // 1. Define exact origins (Covering both Vite defaults)
// const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

// // 2. Apply to Express
// app.use(cors({
//   origin: allowedOrigins,
//   methods: ["GET", "POST"],
//   credentials: true
// }));

// app.use(express.json());

// // Routes
// app.use('/api/ai', aiRoutes);

// app.get('/health', (req, res) => {
//   res.json({ status: 'GridLock Paddock connection clear.' });
// });

// const httpServer = createServer(app);

// // 3. Apply the exact same config to Socket.io
// const io = new Server(httpServer, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"],
//     credentials: true
//   }
// });

// io.on('connection', (socket) => {
//   console.log(`🟢 Paddock connection established: ${socket.id}`);

//   socket.on('send_message', (data) => {
//     io.emit('receive_message', data);
//   });

//   socket.on('disconnect', () => {
//     console.log(`🔴 Paddock connection lost: ${socket.id}`);
//   });
// });

// httpServer.listen(PORT, () => {
//   console.log(`🏎️  GridLock Backend roaring at http://localhost:${PORT}`);
// });

// const startServer = async () => {
//   await connectDB();
  
//   // Check if server is already listening to avoid the crash
//   if (!httpServer.listening) {
//     httpServer.listen(PORT, () => {
//       console.log(`🏎️  GridLock Backend roaring at http://localhost:${PORT}`);
//     });
//   }
// };

// startServer();

// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import aiRoutes from './routes/ai.js';
// import { connectDB } from './config/db.js';
// import authRoutes from './routes/auth.js';
// import mongoose from 'mongoose';
// import historyRoutes from './routes/history.js';
// import { setupPaddockSocket } from './sockets/paddockSocket.js';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5050;

// const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gridlock';

// mongoose.connect(MONGO_URI)
//   .then(() => console.log('🗄️  GridLock Database connected successfully'))
//   .catch((err) => console.error('Database connection error:', err));
 
  
// // Middleware
// const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
// app.use(cors({ origin: allowedOrigins, methods: ["GET", "POST"], credentials: true }));
// app.use(express.json());

// // Routes
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

// io.on('connection', (socket) => {
//   console.log(`🟢 Paddock connection established: ${socket.id}`);
//   socket.on('send_message', (data) => io.emit('receive_message', data));
//   socket.on('disconnect', () => console.log(`🔴 Paddock connection lost: ${socket.id}`));
// });

// // Start everything once
// const startServer = async () => {
//   try {
//     await connectDB();
//     httpServer.listen(PORT, () => {
//       console.log(`🏎️  GridLock Backend roaring at http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error("Failed to start server:", error);
//   }
// };

// startServer();

// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { createServer } from 'http';
// import { Server } from 'socket.io';
// import mongoose from 'mongoose';

// // Routes & Modules
// import aiRoutes from './routes/ai.js';
// import authRoutes from './routes/auth.js';
// import historyRoutes from './routes/history.js';
// import { setupPaddockSocket } from './sockets/paddockSocket.js';
// import { connectDB } from './config/db.js';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5050;

// // Middleware
// const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
// app.use(cors({ origin: allowedOrigins, methods: ["GET", "POST"], credentials: true }));
// app.use(express.json());

// // Routes
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
import mongoose from 'mongoose';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes & Modules
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import historyRoutes from './routes/history.js';
import { setupPaddockSocket } from './sockets/paddockSocket.js';
import { connectDB } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
app.use(cors({ origin: allowedOrigins, methods: ["GET", "POST"], credentials: true }));
app.use(express.json());

// ----------------------------------------------------------------------
// NEW: Python Telemetry Generator Route
// ----------------------------------------------------------------------
app.post('/api/generate-race', (req, res) => {
  const { year, gp, session } = req.body;

  // Assuming 'backend' and 'data script' are sibling folders in your root
  // If app.ts is inside a 'src' folder (e.g. backend/src/app.ts), change '..' to '../../'
  const scriptPath = path.join(__dirname, '../../data_scripts/full_race_generator.py');

  // Build the terminal command dynamically
  // Point directly to the python executable inside your virtual environment
const pythonExecutable = "/Users/heisenberg/Desktop/GridLock/data_scripts/venv/bin/python";

// Build the command using that specific executable
const command = `"${pythonExecutable}" "${scriptPath}" --year ${year} --gp "${gp}" --session ${session}`;
  // const command = `python3 "${scriptPath}" --year ${year} --gp "${gp}" --session ${session}`;

  console.log(`Executing: ${command}`);

  // Run the Python script
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating telemetry: ${error.message}`);
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ error: "Failed to generate race data. Check backend logs." });
    }

    console.log(`Python Output: ${stdout}`);

    // Construct the expected file name to send back to React
    const safeGpName = gp.toLowerCase().replace(/ /g, "_");
    const raceId = `${year}_${safeGpName}_${session.toLowerCase()}`;

    // Tell React it's done!
    res.json({ success: true, raceId: raceId });
  });
});
// ----------------------------------------------------------------------

// Existing Routes
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', historyRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'GridLock Paddock connection clear.' });
});

// Server & Socket Setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true }
});

// Initialize the modular socket logic
setupPaddockSocket(io);

// Start Server
const startServer = async () => {
  try {
    await connectDB(); // This handles the Mongoose connection
    httpServer.listen(PORT, () => {
      console.log(`🏎️  GridLock Backend roaring at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();