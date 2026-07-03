// import React, { useState, useEffect, useRef } from 'react';
// import { io, Socket } from 'socket.io-client';

// // Connect to your Express/Socket server
// // (Make sure the port matches your backend, which is 5000 based on your app.ts)
// const socket: Socket = io('http://localhost:5050', {
//   transports: ['websocket', 'polling'], // Prioritize websocket
//   withCredentials: true
// });

// interface ChatMessage {
//   id: string;
//   senderId: string;
//   text: string;
// }

// export default function PaddockChat() {
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [input, setInput] = useState('');
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // Scroll to bottom when messages update
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   // Set up socket listeners
//   useEffect(() => {
//     // Listen for incoming messages
//     socket.on('receive_message', (data: ChatMessage) => {
//       setMessages((prev) => [...prev, data]);
//     });

//     // Cleanup listener on unmount
//     return () => {
//       socket.off('receive_message');
//     };
//   }, []);

//   const handleSend = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!input.trim()) return;

//     const newMessage: ChatMessage = {
//       id: Date.now().toString(),
//       senderId: socket.id || 'Unknown', // Using the unique socket ID
//       text: input,
//     };

//     // Emit the message to the server
//     socket.emit('send_message', newMessage);
//     setInput('');
//   };

//   return (
//     <div className="flex flex-col h-full w-full bg-black/95">
//       {/* Chat History Area */}
//       <div className="flex-1 overflow-y-auto p-6 space-y-4">
//         {messages.map((msg) => {
//           const isMe = msg.senderId === socket.id;
//           return (
//             <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
//               <div className="text-[10px] text-neutral-500 font-mono mb-1 px-1">
//                 {isMe ? 'You' : `User_${msg.senderId.slice(0, 4)}`}
//               </div>
//               <div className={`max-w-[70%] p-3 rounded-xl ${
//                 isMe 
//                   ? 'bg-blue-600 text-white rounded-br-none' 
//                   : 'bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-bl-none'
//               }`}>
//                 <p className="text-sm leading-relaxed">{msg.text}</p>
//               </div>
//             </div>
//           );
//         })}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input Area */}
//       <div className="p-4 border-t border-neutral-800 bg-neutral-950">
//         <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Message #paddock-chat..."
//             className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
//           />
//           <button 
//             type="submit"
//             disabled={!input.trim()}
//             className="bg-white text-black px-6 py-3 rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50"
//           >
//             SEND
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// import React, { useState, useEffect, useRef } from 'react';
// import { io, Socket } from 'socket.io-client';

// // 1. Initialize socket with AUTH TOKEN
// const socket: Socket = io('http://localhost:5050', {
//   auth: { token: localStorage.getItem('token') },
//   transports: ['websocket'],
// });

// interface ChatMessage {
//   _id: string; // Changed from id to _id (MongoDB standard)
//   senderId: string;
//   username: string;
//   text: string;
// }

// export default function PaddockChat() {
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [input, setInput] = useState('');
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // 2. Fetch history on mount
//   useEffect(() => {
//     fetch('http://localhost:5050/api/paddock-history', {
//       headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//     })
//     .then(res => res.json())
//     .then(data => setMessages(data))
//     .catch(err => console.error("History fetch error:", err));
//   }, []);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   useEffect(() => {
//     // 3. Listen for broadcasted messages (including the one you just sent)
//     socket.on('receive_message', (data: ChatMessage) => {
//       setMessages((prev) => [...prev, data]);
//     });
//     return () => { socket.off('receive_message'); };
//   }, []);

//   useEffect(() => {
//   const loadHistory = async () => {
//     try {
//       const response = await fetch('http://localhost:5050/api/paddock-history', {
//         headers: { 
//           'Authorization': `Bearer ${localStorage.getItem('token')}` 
//         }
//       });
      
//       if (response.ok) {
//         const history = await response.json();
//         setMessages(history); // This replaces the empty array with saved data
//       }
//     } catch (err) {
//       console.error("Failed to load chat history:", err);
//     }
//   };

//   loadHistory();
// }, []); // Empty array ensures this runs only once on mount

//   const handleSend = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!input.trim()) return;

//     // We only emit the text; the server handles the username/userId/timestamp
//     socket.emit('send_message', { text: input });
//     setInput('');
//   };

//   return (
//     <div className="flex flex-col h-full w-full bg-black/95">
//       <div className="flex-1 overflow-y-auto p-6 space-y-4">
//         {messages.map((msg) => (
//           <div key={msg._id || Math.random()} className="flex flex-col items-start">
//             <div className="text-[10px] text-neutral-500 font-mono mb-1 px-1">
//               {msg.username || 'Anonymous'}
//             </div>
//             <div className="max-w-[70%] p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-bl-none">
//               <p className="text-sm leading-relaxed">{msg.text}</p>
//             </div>
//           </div>
//         ))}
//         <div ref={messagesEndRef} />
//       </div>

//       <div className="p-4 border-t border-neutral-800 bg-neutral-950">
//         <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Message #paddock-chat..."
//             className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none"
//           />
//           <button type="submit" className="bg-white text-black px-6 py-3 rounded-lg text-sm font-bold">SEND</button>
//         </form>
//       </div>
//     </div>
//   );
// }

// import React, { useState, useEffect, useRef } from 'react';
// import { io, Socket } from 'socket.io-client';
// import { jwtDecode } from 'jwt-decode'; // npm install jwt-decode

// const socket: Socket = io('http://localhost:5050', {
//   auth: { token: localStorage.getItem('token') },
//   transports: ['websocket'],
// });

// interface ChatMessage {
//   _id: string;
//   senderId: string;
//   username: string;
//   text: string;
// }

// export default function PaddockChat() {
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [input, setInput] = useState('');
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // Get current user ID to determine alignment
//   const token = localStorage.getItem('token');
//   const myUserId = token ? (jwtDecode(token) as any).userId : null;

//   useEffect(() => {
//     // 1. Load History once
//     const loadHistory = async () => {
//       try {
//         const response = await fetch('http://localhost:5050/api/paddock-history', {
//           headers: { 'Authorization': `Bearer ${token}` }
//         });
//         if (response.ok) {
//           const history = await response.json();
//           setMessages(history);
//         }
//       } catch (err) {
//         console.error("History load error:", err);
//       }
//     };
//     loadHistory();

//     // 2. Listen for live messages
//     socket.on('receive_message', (data: ChatMessage) => {
//       setMessages((prev) => {
//         // Prevent duplicates: Check if message ID already exists in state
//         if (prev.find(m => m._id === data._id)) return prev;
//         return [...prev, data];
//       });
//     });

//     return () => { socket.off('receive_message'); };
//   }, [token]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const handleSend = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!input.trim()) return;
//     socket.emit('send_message', { text: input });
//     setInput('');
//   };

//   return (
//     <div className="flex flex-col h-full w-full bg-black/95">
//       <div className="flex-1 overflow-y-auto p-6 space-y-4">
//         {messages.map((msg) => {
//           const isMe = msg.senderId === myUserId;
//           return (
//             <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
//               <div className="text-[10px] text-neutral-500 font-mono mb-1 px-1">
//                 {msg.username}
//               </div>
//               <div className={`max-w-[70%] p-3 rounded-xl ${
//                 isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-neutral-800 text-neutral-200 rounded-bl-none'
//               }`}>
//                 <p className="text-sm">{msg.text}</p>
//               </div>
//             </div>
//           );
//         })}
//         <div ref={messagesEndRef} />
//       </div>

//       <div className="p-4 border-t border-neutral-800 bg-neutral-950">
//         <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none"
//           />
//           <button type="submit" className="bg-white text-black px-6 py-3 rounded-lg text-sm font-bold">SEND</button>
//         </form>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

// 1. Initialize but DO NOT auto-connect yet. 
// We will connect it manually once we are sure we have the token.
const socket: Socket = io('http://localhost:5050', {
  autoConnect: false, 
  transports: ['websocket'],
});

interface ChatMessage {
  _id: string;
  senderId: string;
  username: string;
  text: string;
}

export default function PaddockChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 2. Safely extract the User ID (with fallbacks for different DB schemas)
  const token = localStorage.getItem('token');
  let myUserId: string | null = null;
  
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      // Fallbacks: checks userId, then _id, then id to guarantee a match
      myUserId = decoded.userId || decoded._id || decoded.id; 
    } catch (e) {
      console.error("Invalid token format");
    }
  }

  useEffect(() => {
    if (!token) return;

    // 3. Pass the fresh token and connect the socket
    socket.auth = { token };
    socket.connect();

    // 4. Load History once
    const loadHistory = async () => {
      try {
        const response = await fetch('http://localhost:5050/api/paddock-history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const history = await response.json();
          setMessages(history);
        }
      } catch (err) {
        console.error("History load error:", err);
      }
    };
    
    loadHistory();

    // 5. Listen for live messages
    const handleReceiveMessage = (data: ChatMessage) => {
      setMessages((prev) => {
        if (prev.find(m => m._id === data._id)) return prev;
        return [...prev, data];
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    // 6. Cleanup function (Disconnects when you leave the chat page)
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.disconnect(); 
    };
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    socket.emit('send_message', { text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/95">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          // The crucial check for Right vs Left alignment
          const isMe = msg.senderId === myUserId;
          
          return (
            <div key={msg._id || Math.random()} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="text-[10px] text-neutral-500 font-mono mb-1 px-1">
                {msg.username}
              </div>
              <div className={`max-w-[70%] p-3 rounded-xl ${
                isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-neutral-800 text-neutral-200 rounded-bl-none'
              }`}>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-neutral-800 bg-neutral-950">
        <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message #paddock-chat..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none"
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="bg-white text-black px-6 py-3 rounded-lg text-sm font-bold disabled:opacity-50"
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}

// import React, { useState, useEffect, useRef } from 'react';
// import { io, Socket } from 'socket.io-client';
// import { jwtDecode } from 'jwt-decode';

// // 1. Removed `transports: ['websocket']` so Socket.io can connect safely
// const socket: Socket = io('http://localhost:5050', {
//   autoConnect: false, 
// });

// interface ChatMessage {
//   _id: string;
//   senderId: string;
//   username: string;
//   text: string;
// }

// export default function PaddockChat() {
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [input, setInput] = useState('');
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   // 2. Decode token safely
//   const token = localStorage.getItem('token');
//   let myUserId: string | null = null;
  
//   if (token) {
//     try {
//       const decoded: any = jwtDecode(token);
//       myUserId = decoded.userId || decoded._id || decoded.id; 
//     } catch (e) {
//       console.error("Invalid token format");
//     }
//   }

//   useEffect(() => {
//     if (!token) return;

//     // 3. Connect only if disconnected (protects against React Strict Mode)
//     socket.auth = { token };
//     if (!socket.connected) {
//       socket.connect();
//     }

//     const loadHistory = async () => {
//       try {
//         const response = await fetch('http://localhost:5050/api/paddock-history', {
//           headers: { 'Authorization': `Bearer ${token}` }
//         });
//         if (response.ok) {
//           const history = await response.json();
//           setMessages(history);
//         }
//       } catch (err) {
//         console.error("History load error:", err);
//       }
//     };
    
//     loadHistory();

//     const handleReceiveMessage = (data: ChatMessage) => {
//       setMessages((prev) => {
//         if (prev.find(m => m._id === data._id)) return prev;
//         return [...prev, data];
//       });
//     };

//     socket.on('receive_message', handleReceiveMessage);

//     // 4. Removed socket.disconnect() from cleanup so Strict Mode doesn't kill it
//     return () => {
//       socket.off('receive_message', handleReceiveMessage);
//     };
//   }, [token]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const handleSend = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!input.trim()) return;
//     socket.emit('send_message', { text: input });
//     setInput('');
//   };

//   return (
//     <div className="flex flex-col h-full w-full bg-black/95">
//       <div className="flex-1 overflow-y-auto p-6 space-y-4">
//         {messages.map((msg) => {
//           // 🚨 DIAGNOSTIC: This will tell us exactly why alignment is failing
//           console.log(`My ID: ${myUserId} | Msg ID: ${msg.senderId}`);
          
//           const isMe = msg.senderId === myUserId;
          
//           return (
//             <div key={msg._id || Math.random()} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
//               <div className="text-[10px] text-neutral-500 font-mono mb-1 px-1">
//                 {msg.username}
//               </div>
//               <div className={`max-w-[70%] p-3 rounded-xl ${
//                 isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-neutral-800 text-neutral-200 rounded-bl-none'
//               }`}>
//                 <p className="text-sm">{msg.text}</p>
//               </div>
//             </div>
//           );
//         })}
//         <div ref={messagesEndRef} />
//       </div>

//       <div className="p-4 border-t border-neutral-800 bg-neutral-950">
//         <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Message #paddock-chat..."
//             className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none"
//           />
//           <button type="submit" disabled={!input.trim()} className="bg-white text-black px-6 py-3 rounded-lg text-sm font-bold disabled:opacity-50">SEND</button>
//         </form>
//       </div>
//     </div>
//   );
// }