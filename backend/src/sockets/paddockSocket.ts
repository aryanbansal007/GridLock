// import { Server, Socket } from 'socket.io';
// import jwt from 'jsonwebtoken';
// import { PaddockMessage } from '../models/PaddockMessage.js';

// export const setupPaddockSocket = (io: Server) => {
//   io.on('connection', (socket: Socket) => {
//     // 1. Authenticate the socket
//     const token = socket.handshake.auth.token;
//     let username = "Anonymous";

//     try {
//       if (token) {
//         const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
//         username = decoded.username; // Ensure your JWT payload includes this
//       }
//     } catch (err) {
//       console.warn("Socket connection attempt without valid token.");
//     }

//     console.log(`🟢 Paddock connection: ${socket.id} (User: ${username})`);

//     // 2. Handle incoming messages
//     socket.on('send_message', async (data: { text: string }) => {
//       const messageData = {
//         username,
//         text: data.text,
//         timestamp: new Date()
//       };

//       // Save to MongoDB
//       await PaddockMessage.create(messageData);

//       // Broadcast to all
//       io.emit('receive_message', messageData);
//     });

//     socket.on('disconnect', () => console.log(`🔴 Lost connection: ${socket.id}`));
//   });
// };

// import { Server, Socket } from 'socket.io';
// import jwt from 'jsonwebtoken';
// import { PaddockMessage } from '../models/PaddockMessage.js';

// export const setupPaddockSocket = (io: Server) => {
//   io.on('connection', (socket: Socket) => {
//     // 1. Authenticate the socket
//     const token = socket.handshake.auth.token;
//     let username = "Anonymous";

//     try {
//       if (token) {
//         const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
//         username = decoded.username || "Anonymous"; 
//       }
//     } catch (err) {
//       console.warn("Socket connection: Invalid or missing token.");
//     }

//     console.log(`🟢 Paddock connection: ${socket.id} (User: ${username})`);

//     // 2. Handle incoming messages
//     socket.on('send_message', async (data: { text: string }) => {
//       // Validate input
//       if (!data.text || data.text.trim() === "") return;

//       try {
//         const messageData = {
//         senderId: decoded.userId,
//           username,
//           text: data.text.trim(),
//           timestamp: new Date()
//         };

//         // Save to MongoDB
//         const savedMessage = await PaddockMessage.create(messageData);

//         // Broadcast to all clients (send back the saved message with its DB ID)
//         io.emit('receive_message', savedMessage);
        
//         console.log(`💾 Saved & Broadcasted message from ${username}`);
//       } catch (dbError) {
//         console.error("❌ Failed to save message to MongoDB:", dbError);
//         // Optional: socket.emit('error', 'Message could not be saved');
//       }
//     });

//     socket.on('disconnect', () => console.log(`🔴 Lost connection: ${socket.id}`));
//   });
// };

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PaddockMessage } from '../models/PaddockMessage.js';

export const setupPaddockSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    // 1. Authenticate the socket during handshake
    const token = socket.handshake.auth.token;
    
    // Define these outside the try block so they are accessible in the message listener
    let username = "Anonymous";
    let userId = "unknown";

    try {
      if (token) {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        username = decoded.username || "Anonymous";
        userId = decoded.userId || decoded._id || decoded.id || "unknown"; // Extract userId here
      }
    } catch (err) {
      console.warn("Socket connection: Invalid or missing token.");
    }

    console.log(`🟢 Paddock connection: ${socket.id} (User: ${username})`);

    // 2. Handle incoming messages
    socket.on('send_message', async (data: { text: string }) => {
      // Validate input
      if (!data.text || data.text.trim() === "") return;

      try {
        const messageData = {
          senderId: userId, // Now it correctly uses the variable defined above
          username,
          text: data.text.trim(),
          timestamp: new Date()
        };

        // Save to MongoDB
        const savedMessage = await PaddockMessage.create(messageData);

        // Broadcast the saved message to all clients
        io.emit('receive_message', savedMessage);
        
        console.log(`💾 Saved & Broadcasted message from ${username}`);
      } catch (dbError) {
        console.error("❌ Failed to save message to MongoDB:", dbError);
      }
    });

    socket.on('disconnect', () => console.log(`🔴 Lost connection: ${socket.id}`));
  });
};