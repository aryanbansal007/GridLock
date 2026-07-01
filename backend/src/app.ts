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

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// 1. Define exact origins (Covering both Vite defaults)
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

// 2. Apply to Express
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'GridLock Paddock connection clear.' });
});

const httpServer = createServer(app);

// 3. Apply the exact same config to Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`🟢 Paddock connection established: ${socket.id}`);

  socket.on('send_message', (data) => {
    io.emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Paddock connection lost: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🏎️  GridLock Backend roaring at http://localhost:${PORT}`);
});